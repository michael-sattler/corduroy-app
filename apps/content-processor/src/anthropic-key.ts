import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

const secretsManager = new SecretsManagerClient({});
let cachedApiKey: string | null = null;

export async function getAnthropicApiKey(): Promise<string> {
  if (cachedApiKey) {
    return cachedApiKey;
  }

  const localKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (localKey) {
    cachedApiKey = localKey;
    return localKey;
  }

  const secretArn = process.env.ANTHROPIC_API_KEY_SECRET_ARN?.trim();
  if (!secretArn) {
    throw new Error(
      "Configure ANTHROPIC_API_KEY locally or ANTHROPIC_API_KEY_SECRET_ARN in AWS.",
    );
  }

  const response = await secretsManager.send(
    new GetSecretValueCommand({ SecretId: secretArn }),
  );
  const secret = response.SecretString?.trim();
  if (!secret) {
    throw new Error("Anthropic API key secret is empty.");
  }

  // The secret value is the raw key, not a JSON document, to keep the Lambda
  // contract small and avoid logging or serializing credential metadata.
  cachedApiKey = secret;
  return secret;
}
