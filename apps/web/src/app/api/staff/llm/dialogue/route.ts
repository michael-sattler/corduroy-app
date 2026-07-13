import { NextResponse } from "next/server";
import { requireStaffApiUser, StaffApiAuthError } from "@/lib/auth/staff-api";
import type {
  StaffLlmDialogueRequest,
  StaffLlmDialogueResponse,
  StaffLlmErrorCode,
  StaffLlmMessage,
} from "@/lib/llm/staff-llm-dialogue-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class ProviderError extends Error {
  constructor(
    readonly status: number,
    readonly code: StaffLlmErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

function classifyProviderError(
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

// Map an error code to the status our own endpoint returns. Never mirror the
// provider's raw status (e.g. a provider 404 must not look like a missing route).
const STATUS_BY_CODE: Record<StaffLlmErrorCode, number> = {
  billing: 402,
  rate_limit: 429,
  auth: 502,
  model: 502,
  provider: 502,
  unknown: 500,
};

const MAX_MESSAGES = 40;
const MAX_CONTENT_LENGTH = 8000;

function buildSystemPrompt(clientName?: string | null): string {
  const base =
    "You are Zophia, an operations assistant embedded in the Corduroy staff dashboard. " +
    "You help coaches draft client messages, summarize vault uploads, and reason about 90-day plan execution. " +
    "Keep responses concise, practical, and grounded in the staff context. Use plain language and short paragraphs.";

  if (clientName) {
    return `${base} The staff member is currently viewing the client "${clientName}"; ground your answers in that client's engagement context when relevant.`;
  }

  return `${base} No client is currently selected, so answer generally and suggest selecting a client for grounded responses.`;
}

function sanitizeMessages(input: unknown): StaffLlmMessage[] {
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
    .map((entry) => ({
      role: entry.role === "assistant" ? "assistant" : "user",
      content: entry.content.slice(0, MAX_CONTENT_LENGTH),
    }))
    .slice(-MAX_MESSAGES);
}

function buildStubReply(
  messages: StaffLlmMessage[],
  clientName?: string | null,
): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const question = lastUser?.content.trim() ?? "";
  const context = clientName
    ? `for ${clientName}`
    : "once a client is selected";

  return (
    `Preview mode — no LLM provider is configured yet, so this is a placeholder response.\n\n` +
    `When wired to a live model I'll answer ${context} by pulling milestone status, KPI deltas, ` +
    `open tasks, and recent vault uploads.\n\n` +
    (question
      ? `You asked: “${question}”.`
      : `Send a message to get started.`)
  );
}

async function requestAnthropicReply(
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

export async function POST(request: Request) {
  try {
    await requireStaffApiUser();

    const body = (await request.json().catch(() => ({}))) as StaffLlmDialogueRequest;
    const messages = sanitizeMessages(body.messages);

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "messages is required" },
        { status: 400 },
      );
    }

    if (messages[messages.length - 1].role !== "user") {
      return NextResponse.json(
        { error: "the last message must be from the user" },
        { status: 400 },
      );
    }

    const clientName = body.clientName?.trim() || null;
    const systemPrompt = buildSystemPrompt(clientName);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const model =
      process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-5-20250929";

    if (!apiKey) {
      const response: StaffLlmDialogueResponse = {
        reply: buildStubReply(messages, clientName),
        model: "preview-stub",
        grounded: Boolean(clientName),
        live: false,
      };
      return NextResponse.json(response);
    }

    const reply = await requestAnthropicReply(
      apiKey,
      model,
      systemPrompt,
      messages,
    );

    const response: StaffLlmDialogueResponse = {
      reply,
      model,
      grounded: Boolean(clientName),
      live: true,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof StaffApiAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error instanceof ProviderError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: STATUS_BY_CODE[error.code] ?? 502 },
      );
    }

    const message =
      error instanceof Error ? error.message : "LLM dialogue request failed";
    return NextResponse.json(
      { error: message, code: "unknown" satisfies StaffLlmErrorCode },
      { status: 500 },
    );
  }
}
