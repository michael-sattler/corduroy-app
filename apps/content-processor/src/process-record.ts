import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3EventRecord } from "aws-lambda";
import { enqueueAnalysisJob } from "./analysis-queue.js";
import { objectTypeFromContentType } from "./object-type.js";
import { parseVaultObjectKey } from "./parse-key.js";
import {
  createIngestAnalysisJob,
  insertAnalysisEvent,
  insertIngestAuditEvent,
  resolveClientByBucket,
  upsertVaultObject,
} from "./storage.js";

const s3 = new S3Client({
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

function decodeS3Key(rawKey: string): string {
  return decodeURIComponent(rawKey.replace(/\+/g, " "));
}

export async function processObjectCreatedRecord(
  record: S3EventRecord,
): Promise<void> {
  const bucket = record.s3.bucket.name;
  const s3Key = decodeS3Key(record.s3.object.key);

  if (!s3Key.startsWith("raw/")) {
    return;
  }

  const parsed = parseVaultObjectKey(s3Key);
  if (!parsed || parsed.prefix !== "raw") {
    throw new Error(`Unsupported vault key: ${s3Key}`);
  }

  const client = await resolveClientByBucket(bucket);

  let head;
  try {
    head = await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: s3Key,
      }),
    );
  } catch (error) {
    await insertIngestAuditEvent({
      client_id: client.client_id,
      s3_key: s3Key,
      s3_prefix: parsed.prefix,
      status: "failed",
      reason: "HeadObject failed during ingest",
      metadata: {
        error: error instanceof Error ? error.message : "unknown",
      },
    });
    throw error;
  }

  const contentType = head.ContentType;
  const objectType = objectTypeFromContentType(contentType);
  const sizeBytes = head.ContentLength ?? null;

  const vaultObjectId = await upsertVaultObject({
    client_id: client.client_id,
    s3_key: s3Key,
    prefix: parsed.prefix,
    object_type: objectType,
    source: parsed.source,
    size_bytes: sizeBytes,
  });

  await insertIngestAuditEvent({
    client_id: client.client_id,
    s3_key: s3Key,
    s3_prefix: parsed.prefix,
    status: "completed",
    reason: "Raw object cataloged after S3 ObjectCreated",
    metadata: {
      vault_object_id: vaultObjectId,
      content_type: contentType ?? null,
      size_bytes: sizeBytes,
      event_name: record.eventName,
    },
  });

  const supportedForAnalysis = new Set(["pdf", "csv", "spreadsheet", "document"]);
  const job = await createIngestAnalysisJob({
    client_id: client.client_id,
    vault_object_id: vaultObjectId,
    status: supportedForAnalysis.has(objectType) ? "queued" : "unsupported",
  });

  if (!job.created) {
    return;
  }

  if (!supportedForAnalysis.has(objectType)) {
    await insertAnalysisEvent({
      job_id: job.id,
      client_id: client.client_id,
      stage: "complete",
      level: "warning",
      message: "Document analysis skipped because this file type is not supported.",
      details: { object_type: objectType, content_type: contentType ?? null },
    });
    return;
  }

  await insertAnalysisEvent({
    job_id: job.id,
    client_id: client.client_id,
    stage: "queued",
    message: "Document analysis queued after Vault cataloging.",
    details: {
      object_type: objectType,
      content_type: contentType ?? null,
      size_bytes: sizeBytes,
    },
  });

  const queued = await enqueueAnalysisJob({ jobId: job.id, bucket });
  if (!queued) {
    await insertAnalysisEvent({
      job_id: job.id,
      client_id: client.client_id,
      stage: "queued",
      level: "warning",
      message: "Document analysis is not enabled in this environment yet.",
    });
  }
}
