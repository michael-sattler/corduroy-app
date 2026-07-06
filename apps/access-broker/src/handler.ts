import type {
  APIGatewayProxyResult,
  Context,
  Handler,
} from "aws-lambda";
import { mintPresignedUrl } from "./presign.js";
import { insertAuditEvent, loadClientVaultStorage } from "./storage.js";
import type {
  AccessBrokerErrorResponse,
  AccessBrokerRequest,
  AccessBrokerResponse,
} from "./types.js";
import {
  buildUploadObjectKey,
  extensionForUpload,
  validateObjectKey,
  validateUploadInput,
  validateUploadPrefix,
} from "./validate.js";

function errorResponse(
  statusCode: number,
  message: string,
  code?: string,
): APIGatewayProxyResult {
  const body: AccessBrokerErrorResponse = { error: message, code };
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

function parseRequest(event: unknown): AccessBrokerRequest {
  if (!event || typeof event !== "object") {
    throw new Error("Invalid invoke payload");
  }

  const payload = event as AccessBrokerRequest;

  if (
    payload.operation !== "presign_put" &&
    payload.operation !== "presign_get"
  ) {
    throw new Error("Invalid operation");
  }

  if (!payload.client_id || !payload.actor_user_id) {
    throw new Error("client_id and actor_user_id are required");
  }

  return payload;
}

export const handler: Handler = async (
  event,
  _context: Context,
): Promise<APIGatewayProxyResult> => {
  try {
    const request = parseRequest(event);
    const storage = await loadClientVaultStorage(request.client_id);
    const reason = request.reason?.trim() || defaultReason(request.operation);

    let s3Key: string;
    let s3Prefix: string;
    let contentType: string | undefined;

    if (request.operation === "presign_put") {
      if (!request.upload) {
        return errorResponse(400, "upload metadata is required for presign_put");
      }

      const validated = validateUploadInput(request.upload);
      validateUploadPrefix(validated.prefix);
      contentType = validated.contentType;
      s3Prefix = validated.prefix;
      s3Key = buildUploadObjectKey({
        prefix: validated.prefix,
        sourceSlug: validated.sourceSlug,
        extension: extensionForUpload(
          request.upload.filename,
          validated.contentType,
        ),
      });
    } else {
      if (!request.s3_key) {
        return errorResponse(400, "s3_key is required for presign_get");
      }

      s3Prefix = validateObjectKey(request.s3_key);
      s3Key = request.s3_key.trim();
    }

    const { url, expires_in } = await mintPresignedUrl({
      operation: request.operation,
      bucketName: storage.bucket_name,
      kmsKeyArn: storage.kms_key_arn,
      s3Key,
      contentType,
    });

    const auditEventId = await insertAuditEvent({
      client_id: request.client_id,
      actor_user_id: request.actor_user_id,
      action:
        request.operation === "presign_put"
          ? "vault.presign_put"
          : "vault.presign_get",
      status: request.operation === "presign_put" ? "pending" : "completed",
      s3_key: s3Key,
      s3_prefix: s3Prefix,
      reason,
      metadata: {
        content_type: contentType ?? null,
        source: request.upload?.source ?? null,
      },
    });

    const response: AccessBrokerResponse = {
      operation: request.operation,
      client_id: request.client_id,
      bucket_name: storage.bucket_name,
      s3_key: s3Key,
      s3_prefix: s3Prefix as AccessBrokerResponse["s3_prefix"],
      url,
      expires_in,
      audit_event_id: auditEventId,
    };

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(response),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "AccessBroker failed";
    const statusCode = message.includes("not provisioned") ? 404 : 400;
    return errorResponse(statusCode, message);
  }
};

function defaultReason(operation: AccessBrokerRequest["operation"]): string {
  return operation === "presign_put"
    ? "Client upload pre-sign"
    : "Client download pre-sign";
}
