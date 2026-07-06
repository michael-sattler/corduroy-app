import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { S3EventRecord } from "aws-lambda";
import { objectTypeFromContentType } from "./object-type.js";
import { parseVaultObjectKey } from "./parse-key.js";
import {
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
}
