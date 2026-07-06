import {
  InvokeCommand,
  LambdaClient,
  type InvokeCommandOutput,
} from "@aws-sdk/client-lambda";

export type VaultPrefix = "raw" | "derived" | "context" | "audit";

export type AccessBrokerOperation = "presign_put" | "presign_get";

export type AccessBrokerUploadInput = {
  filename: string;
  content_type: string;
  source: string;
  prefix?: VaultPrefix;
};

export type AccessBrokerRequest = {
  operation: AccessBrokerOperation;
  client_id: string;
  actor_user_id: string;
  reason?: string;
  upload?: AccessBrokerUploadInput;
  s3_key?: string;
};

export type AccessBrokerResponse = {
  operation: AccessBrokerOperation;
  client_id: string;
  bucket_name: string;
  s3_key: string;
  s3_prefix: VaultPrefix;
  url: string;
  expires_in: number;
  audit_event_id: string;
};

export class AccessBrokerError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 502) {
    super(message);
    this.name = "AccessBrokerError";
    this.statusCode = statusCode;
  }
}

function getLambdaClient(): LambdaClient {
  return new LambdaClient({
    region: process.env.AWS_REGION ?? "us-east-1",
  });
}

function getFunctionName(): string {
  const functionName = process.env.ACCESS_BROKER_LAMBDA_NAME;
  if (!functionName) {
    throw new AccessBrokerError(
      "ACCESS_BROKER_LAMBDA_NAME is not configured",
      503,
    );
  }
  return functionName;
}

function decodePayload(output: InvokeCommandOutput): string {
  if (!output.Payload) {
    return "";
  }

  if (output.Payload instanceof Uint8Array) {
    return Buffer.from(output.Payload).toString("utf8");
  }

  return String(output.Payload);
}

export async function invokeAccessBroker(
  request: AccessBrokerRequest,
): Promise<AccessBrokerResponse> {
  const client = getLambdaClient();

  const output = await client.send(
    new InvokeCommand({
      FunctionName: getFunctionName(),
      InvocationType: "RequestResponse",
      Payload: Buffer.from(JSON.stringify(request)),
    }),
  );

  if (output.FunctionError) {
    throw new AccessBrokerError(
      `AccessBroker invoke failed: ${decodePayload(output) || output.FunctionError}`,
      502,
    );
  }

  const raw = decodePayload(output);
  if (!raw) {
    throw new AccessBrokerError("AccessBroker returned an empty response", 502);
  }

  let envelope: { statusCode?: number; body?: string };
  try {
    envelope = JSON.parse(raw) as { statusCode?: number; body?: string };
  } catch {
    throw new AccessBrokerError("AccessBroker returned invalid JSON", 502);
  }

  const statusCode = envelope.statusCode ?? 500;
  const body = envelope.body ?? "";

  if (statusCode >= 400) {
    let message = "AccessBroker request failed";
    try {
      const parsed = JSON.parse(body) as { error?: string };
      if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      if (body) {
        message = body;
      }
    }
    throw new AccessBrokerError(message, statusCode);
  }

  try {
    return JSON.parse(body) as AccessBrokerResponse;
  } catch {
    throw new AccessBrokerError("AccessBroker returned invalid success payload", 502);
  }
}

export function isAccessBrokerConfigured(): boolean {
  return Boolean(process.env.ACCESS_BROKER_LAMBDA_NAME?.trim());
}

export type AccessBrokerHealthStatus =
  | "healthy"
  | "not_configured"
  | "unhealthy";

export type AccessBrokerHealth = {
  status: AccessBrokerHealthStatus;
  function_name: string | null;
  detail: string;
  latency_ms: number | null;
  checked_at: string;
};

export async function checkAccessBrokerHealth(): Promise<AccessBrokerHealth> {
  const checkedAt = new Date().toISOString();
  const functionName = process.env.ACCESS_BROKER_LAMBDA_NAME?.trim();

  if (!functionName) {
    return {
      status: "not_configured",
      function_name: null,
      detail: "ACCESS_BROKER_LAMBDA_NAME is not set on the orchestration API",
      latency_ms: null,
      checked_at: checkedAt,
    };
  }

  const started = Date.now();

  try {
    const client = getLambdaClient();
    await client.send(
      new InvokeCommand({
        FunctionName: functionName,
        InvocationType: "DryRun",
        Payload: Buffer.from("{}"),
      }),
    );

    const latencyMs = Date.now() - started;
    return {
      status: "healthy",
      function_name: functionName,
      detail: `Invoke permitted (${latencyMs}ms)`,
      latency_ms: latencyMs,
      checked_at: checkedAt,
    };
  } catch (error) {
    const latencyMs = Date.now() - started;
    const detail =
      error instanceof Error ? error.message : "AccessBroker health check failed";

    return {
      status: "unhealthy",
      function_name: functionName,
      detail,
      latency_ms: latencyMs,
      checked_at: checkedAt,
    };
  }
}
