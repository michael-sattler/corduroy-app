import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({});

export async function enqueueAnalysisJob(input: {
  jobId: string;
  bucket: string;
}): Promise<boolean> {
  const queueUrl = process.env.ANALYSIS_QUEUE_URL?.trim();
  if (process.env.ANALYSIS_ENABLED !== "true" || !queueUrl) {
    return false;
  }

  await sqs.send(
    new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({ job_id: input.jobId, bucket: input.bucket }),
    }),
  );

  return true;
}
