import type { Handler, S3Event, SQSEvent } from "aws-lambda";
import { processAnalysisQueueMessage } from "./document-analysis.js";
import { processObjectCreatedRecord } from "./process-record.js";
import { queueStaffReanalysis } from "./reprocess.js";

type AnalysisQueueMessage = { job_id?: unknown; bucket?: unknown };
type ReprocessRequest = {
  action?: unknown;
  client_id?: unknown;
  vault_object_id?: unknown;
};

function isSqsEvent(event: S3Event | SQSEvent | ReprocessRequest): event is SQSEvent {
  return "Records" in event && event.Records[0]?.eventSource === "aws:sqs";
}

function isReprocessRequest(
  event: S3Event | SQSEvent | ReprocessRequest,
): event is ReprocessRequest {
  return "action" in event && event.action === "staff_reanalyze";
}

export const handler: Handler<S3Event | SQSEvent | ReprocessRequest> = async (event) => {
  if (isReprocessRequest(event)) {
    if (
      typeof event.client_id !== "string" ||
      typeof event.vault_object_id !== "string"
    ) {
      throw new Error("Reprocess request is missing client_id or vault_object_id.");
    }
    await queueStaffReanalysis({
      clientId: event.client_id,
      vaultObjectId: event.vault_object_id,
    });
    return;
  }

  const errors: string[] = [];

  if (isSqsEvent(event)) {
    for (const record of event.Records) {
      try {
        const message = JSON.parse(record.body) as AnalysisQueueMessage;
        if (
          typeof message.job_id !== "string" ||
          typeof message.bucket !== "string"
        ) {
          throw new Error("Analysis queue message is missing job_id or bucket.");
        }
        await processAnalysisQueueMessage({
          jobId: message.job_id,
          bucket: message.bucket,
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "ContentProcessor failed";
        errors.push(`${record.messageId}: ${message}`);
      }
    }
  } else {
    for (const record of event.Records) {
      try {
        await processObjectCreatedRecord(record);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "ContentProcessor failed";
        errors.push(`${record.s3.bucket.name}/${record.s3.object.key}: ${message}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
};
