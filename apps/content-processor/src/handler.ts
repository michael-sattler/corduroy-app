import type { S3Handler } from "aws-lambda";
import { processObjectCreatedRecord } from "./process-record.js";

export const handler: S3Handler = async (event) => {
  const errors: string[] = [];

  for (const record of event.Records) {
    try {
      await processObjectCreatedRecord(record);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ContentProcessor failed";
      errors.push(`${record.s3.bucket.name}/${record.s3.object.key}: ${message}`);
    }
  }

  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
};
