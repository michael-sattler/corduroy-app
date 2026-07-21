import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { jsonrepair } from "jsonrepair";
import * as mammoth from "mammoth";
import * as XLSX from "@stackline/xlsx";
import { getAnthropicApiKey } from "./anthropic-key.js";
import {
  claimAnalysisJob,
  finishAnalysisJob,
  getAnalysisJob,
  insertAnalysisCandidates,
  insertAnalysisEvent,
  loadAnalysisMetricTargets,
  requeueAnalysisJob,
  type AnalysisMetricTarget,
} from "./storage.js";

const s3 = new S3Client({
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
const MAX_NORMALIZED_CHARS = 60_000;
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ANALYSIS_RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["classification", "observations"],
  properties: {
    classification: {
      type: "object",
      additionalProperties: false,
      required: ["documentType", "likelyOrigin", "summary"],
      properties: {
        documentType: { type: "string" },
        likelyOrigin: { type: "string" },
        summary: { type: "string" },
      },
    },
    observations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "metricKey",
          "metricLabel",
          "value",
          "unit",
          "periodStart",
          "periodEnd",
          "confidence",
          "evidenceExcerpt",
          "evidenceLocator",
        ],
        properties: {
          metricKey: { type: "string" },
          metricLabel: { type: "string" },
          value: { type: "number" },
          unit: { type: "string" },
          periodStart: { type: "string" },
          periodEnd: { type: "string" },
          confidence: { type: "number" },
          evidenceExcerpt: { type: "string" },
          evidenceLocator: {
            type: "object",
            additionalProperties: false,
            required: ["page", "sheet", "row"],
            properties: {
              page: { type: "number" },
              sheet: { type: "string" },
              row: { type: "string" },
            },
          },
        },
      },
    },
  },
} as const;

type ExtractedDocument = {
  kind: "pdf" | "text";
  text?: string;
  bytes: Uint8Array;
};

type ProposedObservation = {
  metricKey?: unknown;
  metricLabel?: unknown;
  value?: unknown;
  unit?: unknown;
  periodStart?: unknown;
  periodEnd?: unknown;
  confidence?: unknown;
  evidenceExcerpt?: unknown;
  evidenceLocator?: unknown;
};

type AnalysisResponse = {
  classification?: {
    documentType?: unknown;
    likelyOrigin?: unknown;
    summary?: unknown;
  };
  observations?: unknown;
};

function asText(value: unknown, maxLength = 1000): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function asFiniteNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asConfidence(value: unknown): number | null {
  const confidence = asFiniteNumber(value);
  return confidence === null ? null : Math.max(0, Math.min(1, confidence));
}

function trimText(text: string): string {
  return text.replace(/\u0000/g, "").trim().slice(0, MAX_NORMALIZED_CHARS);
}

async function readObject(bucket: string, key: string): Promise<Uint8Array> {
  const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!response.Body) {
    throw new Error("Uploaded document had no readable body.");
  }

  const bytes = await response.Body.transformToByteArray();
  if (bytes.byteLength > MAX_DOCUMENT_BYTES) {
    throw new Error(
      `Document exceeds the ${Math.floor(MAX_DOCUMENT_BYTES / 1024 / 1024)} MB analysis limit.`,
    );
  }

  return bytes;
}

async function extractDocument(
  objectType: string,
  bytes: Uint8Array,
): Promise<ExtractedDocument> {
  if (objectType === "pdf") {
    return { kind: "pdf", bytes };
  }

  if (objectType === "csv") {
    return {
      kind: "text",
      bytes,
      text: trimText(new TextDecoder("utf-8", { fatal: false }).decode(bytes)),
    };
  }

  if (objectType === "document") {
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    return { kind: "text", bytes, text: trimText(result.value) };
  }

  if (objectType === "spreadsheet") {
    const workbook = XLSX.read(bytes, {
      type: "array",
      raw: false,
      dense: true,
    });
    const text = workbook.SheetNames.map((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(
        worksheet,
        { header: 1, raw: false, blankrows: false },
      );
      return [
        `Sheet: ${sheetName}`,
        ...rows.map((row) => row.map((cell) => String(cell ?? "")).join("\t")),
      ].join("\n");
    }).join("\n\n");
    return { kind: "text", bytes, text: trimText(text) };
  }

  throw new Error(`Unsupported document type: ${objectType}`);
}

function parseResponse(raw: string): AnalysisResponse {
  const withoutFence = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  let parsed: unknown;
  try {
    parsed = JSON.parse(withoutFence);
  } catch {
    // Structured output should already be valid JSON, but retain a narrow
    // recovery path for occasional punctuation defects from the provider.
    parsed = JSON.parse(jsonrepair(withoutFence));
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("The model returned an invalid extraction response.");
  }
  return parsed as AnalysisResponse;
}

function buildSystemPrompt(targets: AnalysisMetricTarget[]): string {
  return `You extract factual KPI observations from a single business document.
Return an object that matches the supplied JSON schema.
{
  "classification": {
    "documentType": "short label",
    "likelyOrigin": "short label or unknown",
    "summary": "one sentence"
  },
  "observations": [{
    "metricKey": "one supplied metric key or empty string",
    "metricLabel": "document label",
    "value": 123.45,
    "unit": "currency|percent|count|days|ratio|months or empty string",
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "confidence": 0.0,
    "evidenceExcerpt": "minimal supporting excerpt, max 240 characters",
    "evidenceLocator": {"page": 0, "sheet": "", "row": ""}
  }]
}
Propose every supported value explicitly present in the document. Do not estimate, infer a missing date, or create a metric that is not supported by evidence. Use an empty observations array when nothing qualifies.
For stock metrics, periodStart and periodEnd must be the same date. For flow metrics, provide the stated inclusive period.
The observation date is the document's stated reporting or "as of" date, never the date this analysis runs. For MTD or YTD values, use the report date as periodEnd and the applicable month/year start as periodStart. Never infer the final day of a calendar month or any future period end; if the document does not state a reporting cutoff, do not propose the observation.
Map semantically equivalent document labels to the supplied client metrics even when their wording differs. For example, a document's "Month Gross Total" or "Year Gross Total" may map to "Monthly Gross Revenue"; "Monthly Net", "Year Net Total", or the typo "Year Net Toal" may map to "Net Income". Use the supplied metricKey for that mapping and preserve the document label in metricLabel.
Available client metrics:
${JSON.stringify(
  targets.map((target) => ({
    metricKey: target.metric_key,
    label: target.label,
    unit: target.unit,
    stockFlow: target.stock_flow,
    sourceBinding: target.source_binding,
  })),
)}`;
}

async function requestAnalysis(
  document: ExtractedDocument,
  targets: AnalysisMetricTarget[],
): Promise<{ result: AnalysisResponse; model: string }> {
  const apiKey = await getAnthropicApiKey();

  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
  const content =
    document.kind === "pdf"
      ? [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: "application/pdf",
              data: Buffer.from(document.bytes).toString("base64"),
            },
          },
          { type: "text", text: "Extract the requested KPI observations from this PDF." },
        ]
      : [{ type: "text", text: document.text ?? "" }];

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      temperature: 0,
      system: buildSystemPrompt(targets),
      messages: [{ role: "user", content }],
      output_config: {
        format: {
          type: "json_schema",
          schema: ANALYSIS_RESPONSE_SCHEMA,
        },
      },
    }),
    signal: AbortSignal.timeout(55_000),
  });

  if (!response.ok) {
    throw new Error(`Anthropic document analysis request failed (${response.status}).`);
  }

  const payload = (await response.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = payload.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
  if (!text) {
    throw new Error("Anthropic returned an empty document analysis response.");
  }

  return { result: parseResponse(text), model };
}

function toCandidates(
  observations: unknown,
  job: { client_id: string; id: string; vault_object_id: string },
  targets: AnalysisMetricTarget[],
) {
  if (!Array.isArray(observations)) {
    return [];
  }

  const targetByKey = new Map(targets.map((target) => [target.metric_key, target]));
  return observations.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return [];
    }

    const proposed = entry as ProposedObservation;
    const value = asFiniteNumber(proposed.value);
    const periodStart = asText(proposed.periodStart, 10);
    const periodEnd = asText(proposed.periodEnd, 10);
    if (
      value === null ||
      !ISO_DATE.test(periodStart) ||
      !ISO_DATE.test(periodEnd) ||
      periodEnd < periodStart
    ) {
      return [];
    }

    const metricKey = asText(proposed.metricKey, 120);
    const target = targetByKey.get(metricKey) ?? null;
    if (target?.stock_flow !== "flow" && periodStart !== periodEnd) {
      return [];
    }

    const evidenceLocator =
      proposed.evidenceLocator &&
      typeof proposed.evidenceLocator === "object" &&
      !Array.isArray(proposed.evidenceLocator)
        ? (proposed.evidenceLocator as Record<string, unknown>)
        : {};

    return [
      {
        client_id: job.client_id,
        vault_analysis_job_id: job.id,
        vault_object_id: job.vault_object_id,
        client_metric_id: target?.client_metric_id ?? null,
        metric_label: asText(proposed.metricLabel, 240) || target?.label || metricKey,
        value,
        unit: asText(proposed.unit, 50) || target?.unit || "",
        period_start: periodStart,
        period_end: periodEnd,
        confidence: asConfidence(proposed.confidence),
        evidence_excerpt: asText(proposed.evidenceExcerpt, 1000),
        evidence_locator: evidenceLocator,
      },
    ];
  });
}

export async function analyseVaultDocument(input: {
  jobId: string;
  bucket: string;
}): Promise<void> {
  const job = await getAnalysisJob(input.jobId);
  if (!job || job.status !== "queued") {
    return;
  }

  if (!(await claimAnalysisJob(job))) {
    return;
  }

  const object = Array.isArray(job.vault_objects)
    ? (job.vault_objects[0] ?? null)
    : job.vault_objects;
  if (!object) {
    throw new Error("Vault object missing for analysis job.");
  }

  await insertAnalysisEvent({
    job_id: job.id,
    client_id: job.client_id,
    stage: "download",
    message: "Reading the encrypted Vault object in the ContentProcessor.",
  });
  const bytes = await readObject(input.bucket, object.s3_key);

  await insertAnalysisEvent({
    job_id: job.id,
    client_id: job.client_id,
    stage: "inspect",
    message: "Inspecting document format and size.",
    details: { object_type: object.object_type, byte_length: bytes.byteLength },
  });
  const document = await extractDocument(object.object_type, bytes);

  await insertAnalysisEvent({
    job_id: job.id,
    client_id: job.client_id,
    stage: document.kind === "pdf" ? "extract_text" : "extract_tables",
    message:
      document.kind === "pdf"
        ? "Prepared PDF for model analysis."
        : "Normalized document text and tables for model analysis.",
    details: { normalized_characters: document.text?.length ?? null },
  });

  const targets = await loadAnalysisMetricTargets(job.client_id);
  await insertAnalysisEvent({
    job_id: job.id,
    client_id: job.client_id,
    stage: "match_metrics",
    message: "Loaded active client metrics for grounded extraction.",
    details: { metric_target_count: targets.length },
  });

  const { result, model } = await requestAnalysis(document, targets);
  await insertAnalysisEvent({
    job_id: job.id,
    client_id: job.client_id,
    stage: "classify",
    message: "Classified the document and extracted evidence-backed KPI proposals.",
    details: {
      document_type: asText(result.classification?.documentType, 120),
      likely_origin: asText(result.classification?.likelyOrigin, 240),
    },
  });

  const candidates = toCandidates(result.observations, job, targets);
  await insertAnalysisCandidates(candidates);
  await insertAnalysisEvent({
    job_id: job.id,
    client_id: job.client_id,
    stage: "validate_candidates",
    message: "Validated extracted values and staged them for staff review.",
    details: { candidate_count: candidates.length },
  });

  await finishAnalysisJob({
    job_id: job.id,
    status: "completed",
    classification: {
      document_type: asText(result.classification?.documentType, 120),
      likely_origin: asText(result.classification?.likelyOrigin, 240),
      summary: asText(result.classification?.summary, 1000),
    },
    model_metadata: { provider: "anthropic", model },
  });
  await insertAnalysisEvent({
    job_id: job.id,
    client_id: job.client_id,
    stage: "complete",
    message: "Analysis complete. KPI proposals are awaiting staff review.",
    details: { candidate_count: candidates.length },
  });
}

export async function processAnalysisQueueMessage(input: {
  jobId: string;
  bucket: string;
}): Promise<void> {
  try {
    await analyseVaultDocument(input);
  } catch (error) {
    const job = await getAnalysisJob(input.jobId);
    if (!job) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Document analysis failed.";
    if (job.attempt_count < 3) {
      await requeueAnalysisJob({
        job_id: job.id,
        error_code: "analysis_retry",
        error_message: message,
      });
      await insertAnalysisEvent({
        job_id: job.id,
        client_id: job.client_id,
        stage: "failed",
        level: "warning",
        message: "Analysis attempt failed and will be retried automatically.",
        details: { attempt: job.attempt_count, error: message },
      });
      throw error;
    }

    await finishAnalysisJob({
      job_id: job.id,
      status: "failed",
      error_code: "analysis_failed",
      error_message: message,
    });
    await insertAnalysisEvent({
      job_id: job.id,
      client_id: job.client_id,
      stage: "failed",
      level: "error",
      message: "Document analysis failed. Staff may retry after reviewing this error.",
      details: { error: message },
    });
  }
}
