import "server-only";

import type {
  StaffLlmErrorCode,
  StaffLlmMessage,
  StaffLlmStatusResponse,
} from "@/lib/llm/staff-llm-dialogue-types";

const PROVIDER = "anthropic";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 8000;

export class ProviderError extends Error {
  constructor(
    readonly status: number,
    readonly code: StaffLlmErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

// Map an error code to the status our own endpoint returns. Never mirror the
// provider's raw status (e.g. a provider 404 must not look like a missing route).
export const STATUS_BY_CODE: Record<StaffLlmErrorCode, number> = {
  billing: 402,
  rate_limit: 429,
  auth: 502,
  model: 502,
  provider: 502,
  unknown: 500,
};

export function resolveModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

export function getApiKey(): string | undefined {
  return process.env.ANTHROPIC_API_KEY;
}

export function classifyProviderError(
  status: number,
  rawBody: string,
): { code: StaffLlmErrorCode; message: string } {
  let providerType = "";
  let providerMessage = "";
  try {
    const parsed = JSON.parse(rawBody) as {
      error?: { type?: string; message?: string };
    };
    providerType = parsed.error?.type ?? "";
    providerMessage = parsed.error?.message ?? "";
  } catch {
    // Non-JSON body — fall back to status-based classification below.
  }

  const lowerMessage = providerMessage.toLowerCase();

  if (lowerMessage.includes("credit balance") || status === 402) {
    return {
      code: "billing",
      message:
        "Anthropic credit balance is too low. Add credits in the Anthropic console to continue.",
    };
  }

  if (status === 429 || providerType === "rate_limit_error") {
    return {
      code: "rate_limit",
      message:
        "Rate limit reached for the current tier. Wait a moment and try again.",
    };
  }

  if (status === 401 || providerType === "authentication_error") {
    return {
      code: "auth",
      message: "The provider rejected the API key.",
    };
  }

  if (status === 404 || providerType === "not_found_error") {
    return {
      code: "model",
      message:
        "Model not available for this account. Check the ANTHROPIC_MODEL value against the models listed in the Anthropic console.",
    };
  }

  return {
    code: "provider",
    message: providerMessage
      ? `Provider error: ${providerMessage}`
      : `Provider request failed (${status}).`,
  };
}

export function sanitizeMessages(input: unknown): StaffLlmMessage[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter(
      (entry): entry is StaffLlmMessage =>
        !!entry &&
        typeof entry === "object" &&
        (entry as StaffLlmMessage).role !== undefined &&
        typeof (entry as StaffLlmMessage).content === "string",
    )
    .map(
      (entry): StaffLlmMessage => ({
        role: entry.role === "assistant" ? "assistant" : "user",
        content: entry.content.slice(0, MAX_CONTENT_LENGTH),
      }),
    )
    .slice(-MAX_MESSAGES);
}

export async function requestAnthropicReply(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: StaffLlmMessage[],
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0.4,
      system: systemPrompt,
      messages,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const { code, message } = classifyProviderError(res.status, detail);
    throw new ProviderError(res.status, code, message);
  }

  const payload = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
  };

  const reply = payload.content
    ?.filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();

  if (!reply) {
    throw new Error("LLM provider returned an empty response");
  }

  return reply;
}

/**
 * Token-free reachability + auth probe against the provider. Callers are
 * responsible for their own surface authorization before invoking this.
 */
export async function probeLlmStatus(): Promise<StaffLlmStatusResponse> {
  const apiKey = getApiKey();
  const model = resolveModel();

  if (!apiKey) {
    return {
      state: "preview",
      provider: PROVIDER,
      model: null,
      detail: "No provider key configured — running in preview stub mode.",
    };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (res.ok) {
      return { state: "connected", provider: PROVIDER, model };
    }

    return {
      state: "error",
      provider: PROVIDER,
      model,
      detail:
        res.status === 401
          ? "Provider rejected the API key (401)."
          : `Provider check failed (${res.status}).`,
    };
  } catch (error) {
    return {
      state: "error",
      provider: PROVIDER,
      model,
      detail:
        error instanceof Error && error.name === "TimeoutError"
          ? "Provider did not respond in time."
          : "Could not reach the provider.",
    };
  }
}
