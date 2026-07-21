import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";

export class ContentProcessorError extends Error {
  constructor(
    message: string,
    readonly statusCode = 502,
  ) {
    super(message);
  }
}

export async function invokeContentProcessorReanalysis(input: {
  client_id: string;
  vault_object_id: string;
}): Promise<void> {
  const functionName = process.env.CONTENT_PROCESSOR_LAMBDA_NAME?.trim();
  if (!functionName) {
    throw new ContentProcessorError("CONTENT_PROCESSOR_LAMBDA_NAME is not configured", 503);
  }
  const client = new LambdaClient({ region: process.env.AWS_REGION ?? "us-east-1" });
  await client.send(
    new InvokeCommand({
      FunctionName: functionName,
      InvocationType: "RequestResponse",
      Payload: Buffer.from(
        JSON.stringify({
          action: "staff_reanalyze",
          client_id: input.client_id,
          vault_object_id: input.vault_object_id,
        }),
      ),
    }),
  );
}
