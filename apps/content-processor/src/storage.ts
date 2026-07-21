import { PostgrestClient } from "@supabase/postgrest-js";
import { randomUUID } from "node:crypto";

export type ClientVaultRecord = {
  client_id: string;
  bucket_name: string;
};

let restClient: PostgrestClient | null = null;

function restHeaders(serviceRoleKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: serviceRoleKey };
  if (serviceRoleKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }
  return headers;
}

function getRestClient(): PostgrestClient {
  if (restClient) {
    return restClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  restClient = new PostgrestClient(`${url}/rest/v1`, {
    headers: restHeaders(serviceRoleKey),
  });

  return restClient;
}

export async function resolveClientByBucket(
  bucketName: string,
): Promise<ClientVaultRecord> {
  const rest = getRestClient();

  const { data, error } = await rest
    .from("client_vault_storage")
    .select("client_id, bucket_name, status, purpose")
    .eq("bucket_name", bucketName)
    .eq("purpose", "primary")
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Vault storage lookup failed: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No client mapped to bucket ${bucketName}`);
  }

  return {
    client_id: data.client_id,
    bucket_name: data.bucket_name,
  };
}

export async function upsertVaultObject(input: {
  client_id: string;
  s3_key: string;
  prefix: string;
  object_type: string;
  source: string;
  size_bytes: number | null;
}): Promise<string> {
  const rest = getRestClient();

  const { data, error } = await rest
    .from("vault_objects")
    .upsert(
      {
        client_id: input.client_id,
        s3_key: input.s3_key,
        prefix: input.prefix,
        object_type: input.object_type,
        source: input.source,
        size_bytes: input.size_bytes,
      },
      { onConflict: "client_id,s3_key" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Vault catalog upsert failed: ${error.message}`);
  }

  return data.id;
}

export async function insertIngestAuditEvent(input: {
  client_id: string;
  s3_key: string;
  s3_prefix: string;
  status: "completed" | "failed";
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const rest = getRestClient();

  const { data, error } = await rest
    .from("audit_events")
    .insert({
      client_id: input.client_id,
      actor_user_id: null,
      action: "vault.ingest_raw",
      status: input.status,
      s3_key: input.s3_key,
      s3_prefix: input.s3_prefix,
      reason: input.reason,
      metadata: input.metadata ?? {},
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Audit insert failed: ${error.message}`);
  }

  return data.id;
}

export type VaultAnalysisEventStage =
  | "queued"
  | "download"
  | "inspect"
  | "extract_text"
  | "extract_tables"
  | "classify"
  | "match_metrics"
  | "validate_candidates"
  | "complete"
  | "failed";

export async function createIngestAnalysisJob(input: {
  client_id: string;
  vault_object_id: string;
  status?: "queued" | "unsupported";
}): Promise<{ id: string; created: boolean }> {
  const rest = getRestClient();
  const idempotencyKey = `ingest:${input.vault_object_id}`;

  const { data: existing, error: existingError } = await rest
    .from("vault_analysis_jobs")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Analysis job lookup failed: ${existingError.message}`);
  }

  if (existing) {
    return { id: existing.id, created: false };
  }

  const { data, error } = await rest
    .from("vault_analysis_jobs")
    .insert({
      client_id: input.client_id,
      vault_object_id: input.vault_object_id,
      trigger: "ingest",
      idempotency_key: idempotencyKey,
      status: input.status ?? "queued",
      processor_version: process.env.CONTENT_PROCESSOR_VERSION ?? "dev",
    })
    .select("id")
    .maybeSingle();

  if (!error && data) {
    return { id: data.id, created: true };
  }

  // An S3 notification can be delivered more than once. If another invocation
  // won the insert race, resolve its job and treat this invocation as a no-op.
  const { data: racedJob, error: racedJobError } = await rest
    .from("vault_analysis_jobs")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (racedJobError || !racedJob) {
    throw new Error(
      `Analysis job creation failed: ${error?.message ?? racedJobError?.message ?? "unknown error"}`,
    );
  }

  return { id: racedJob.id, created: false };
}

export async function createStaffReanalysisJob(input: {
  client_id: string;
  vault_object_id: string;
}): Promise<string> {
  const rest = getRestClient();
  const { data, error } = await rest
    .from("vault_analysis_jobs")
    .insert({
      client_id: input.client_id,
      vault_object_id: input.vault_object_id,
      trigger: "staff_reanalyze",
      idempotency_key: `staff_reanalyze:${input.vault_object_id}:${randomUUID()}`,
      status: "queued",
      processor_version: process.env.CONTENT_PROCESSOR_VERSION ?? "dev",
    })
    .select("id")
    .single();
  if (error) throw new Error(`Staff reanalysis job creation failed: ${error.message}`);
  return data.id;
}

export async function resolveReanalysisTarget(input: {
  client_id: string;
  vault_object_id: string;
}): Promise<{ bucket_name: string; object_type: string }> {
  const rest = getRestClient();
  const [{ data: storage, error: storageError }, { data: object, error: objectError }] =
    await Promise.all([
      rest
        .from("client_vault_storage")
        .select("bucket_name")
        .eq("client_id", input.client_id)
        .eq("purpose", "primary")
        .eq("status", "active")
        .maybeSingle(),
      rest
        .from("vault_objects")
        .select("object_type")
        .eq("id", input.vault_object_id)
        .eq("client_id", input.client_id)
        .maybeSingle(),
    ]);
  if (storageError || !storage) {
    throw new Error(`Vault storage lookup failed: ${storageError?.message ?? "not found"}`);
  }
  if (objectError || !object) {
    throw new Error(`Vault object lookup failed: ${objectError?.message ?? "not found"}`);
  }
  return { bucket_name: storage.bucket_name, object_type: object.object_type };
}

export async function insertAnalysisEvent(input: {
  job_id: string;
  client_id: string;
  stage: VaultAnalysisEventStage;
  level?: "debug" | "info" | "warning" | "error";
  message: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const rest = getRestClient();
  const { error } = await rest.from("vault_analysis_events").insert({
    job_id: input.job_id,
    client_id: input.client_id,
    stage: input.stage,
    level: input.level ?? "info",
    message: input.message,
    details: input.details ?? {},
  });

  if (error) {
    throw new Error(`Analysis event insert failed: ${error.message}`);
  }
}

export type AnalysisJobRecord = {
  id: string;
  client_id: string;
  vault_object_id: string;
  status: "queued" | "running" | "completed" | "failed" | "unsupported" | "cancelled";
  attempt_count: number;
  vault_objects:
    | { s3_key: string; object_type: string; source: string }
    | { s3_key: string; object_type: string; source: string }[]
    | null;
};

export async function getAnalysisJob(jobId: string): Promise<AnalysisJobRecord | null> {
  const rest = getRestClient();
  const { data, error } = await rest
    .from("vault_analysis_jobs")
    .select("id, client_id, vault_object_id, status, attempt_count, vault_objects ( s3_key, object_type, source )")
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    throw new Error(`Analysis job load failed: ${error.message}`);
  }

  return data as AnalysisJobRecord | null;
}

export async function claimAnalysisJob(job: AnalysisJobRecord): Promise<boolean> {
  const rest = getRestClient();
  const { data, error } = await rest
    .from("vault_analysis_jobs")
    .update({
      status: "running",
      attempt_count: job.attempt_count + 1,
      started_at: new Date().toISOString(),
      error_code: null,
      error_message: null,
    })
    .eq("id", job.id)
    .eq("status", "queued")
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Analysis job claim failed: ${error.message}`);
  }

  return Boolean(data);
}

export async function finishAnalysisJob(input: {
  job_id: string;
  status: "completed" | "failed" | "unsupported";
  classification?: Record<string, unknown>;
  model_metadata?: Record<string, unknown>;
  error_code?: string;
  error_message?: string;
}): Promise<void> {
  const rest = getRestClient();
  const { error } = await rest
    .from("vault_analysis_jobs")
    .update({
      status: input.status,
      classification: input.classification ?? {},
      model_metadata: input.model_metadata ?? {},
      error_code: input.error_code ?? null,
      error_message: input.error_message ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq("id", input.job_id);

  if (error) {
    throw new Error(`Analysis job completion failed: ${error.message}`);
  }

  if (input.status === "completed") {
    const { data: job, error: jobError } = await rest
      .from("vault_analysis_jobs")
      .select("vault_object_id")
      .eq("id", input.job_id)
      .single();
    if (jobError) throw new Error(`Analysis job lookup failed: ${jobError.message}`);
    const { error: objectError } = await rest
      .from("vault_objects")
      .update({ is_processed: true })
      .eq("id", job.vault_object_id);
    if (objectError) throw new Error(`Vault processed status update failed: ${objectError.message}`);
  }
}

export async function requeueAnalysisJob(input: {
  job_id: string;
  error_code: string;
  error_message: string;
}): Promise<void> {
  const rest = getRestClient();
  const { error } = await rest
    .from("vault_analysis_jobs")
    .update({
      status: "queued",
      error_code: input.error_code,
      error_message: input.error_message,
      started_at: null,
    })
    .eq("id", input.job_id);

  if (error) {
    throw new Error(`Analysis job retry scheduling failed: ${error.message}`);
  }
}

export type AnalysisMetricTarget = {
  client_metric_id: string;
  metric_key: string;
  label: string;
  unit: string;
  kind: string;
  stock_flow: string | null;
  source_binding: string;
};

export async function loadAnalysisMetricTargets(
  clientId: string,
): Promise<AnalysisMetricTarget[]> {
  const rest = getRestClient();
  const { data, error } = await rest
    .from("client_metrics")
    .select(
      "id, source_binding, metric_definitions ( metric_key, label, unit, kind, stock_flow )",
    )
    .eq("client_id", clientId)
    .eq("is_active", true);

  if (error) {
    throw new Error(`Analysis metric target load failed: ${error.message}`);
  }

  return (data ?? []).flatMap((row) => {
    const definition = Array.isArray(row.metric_definitions)
      ? (row.metric_definitions[0] ?? null)
      : row.metric_definitions;

    if (!definition || definition.kind !== "observed") {
      return [];
    }

    return [
      {
        client_metric_id: row.id,
        metric_key: definition.metric_key,
        label: definition.label,
        unit: definition.unit,
        kind: definition.kind,
        stock_flow: definition.stock_flow ?? null,
        source_binding: row.source_binding,
      },
    ];
  }) as AnalysisMetricTarget[];
}

export async function insertAnalysisCandidates(
  candidates: Array<{
    client_id: string;
    vault_analysis_job_id: string;
    vault_object_id: string;
    client_metric_id: string | null;
    metric_label: string;
    value: number;
    unit: string;
    period_start: string;
    period_end: string;
    confidence: number | null;
    evidence_excerpt: string;
    evidence_locator: Record<string, unknown>;
  }>,
): Promise<void> {
  if (candidates.length === 0) {
    return;
  }

  const rest = getRestClient();
  const { error } = await rest.from("metric_observation_candidates").insert(candidates);

  if (error) {
    throw new Error(`Analysis candidate insert failed: ${error.message}`);
  }
}
