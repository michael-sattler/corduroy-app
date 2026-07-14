import { NextResponse } from "next/server";
import {
  getApiKey,
  ProviderError,
  requestAnthropicReply,
  resolveModel,
  sanitizeMessages,
  STATUS_BY_CODE,
} from "@/lib/llm/llm-provider";
import { recordLlmPromptEvent } from "@/lib/llm/llm-prompt-events";
import type {
  StaffLlmDialogueRequest,
  StaffLlmDialogueResponse,
  StaffLlmErrorCode,
  StaffLlmMessage,
} from "@/lib/llm/staff-llm-dialogue-types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildSystemPrompt(organization?: string | null): string {
  const base =
    "You are Zophia, an assistant embedded in the Corduroy client portal. " +
    "You help the client understand and execute their 90-day plan: explaining tasks, weekly focus, initiative themes, milestones, and KPI progress. " +
    "Keep responses concise, encouraging, and practical. Use plain language and short paragraphs, and never invent plan details you have not been given.";

  if (organization) {
    return `${base} The client belongs to the organization "${organization}"; ground your answers in their 90-day plan when relevant.`;
  }

  return base;
}

function buildStubReply(
  messages: StaffLlmMessage[],
  organization?: string | null,
): string {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const question = lastUser?.content.trim() ?? "";
  const context = organization ? `for ${organization}` : "for your plan";

  return (
    `Preview mode — no LLM provider is configured yet, so this is a placeholder response.\n\n` +
    `When wired to a live model I'll answer ${context} by walking through your weekly focus, ` +
    `open tasks, initiative progress, and KPI trends.\n\n` +
    (question
      ? `You asked: “${question}”.`
      : `Send a message to get started.`)
  );
}

async function resolveClientContext(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<{ organization: string | null; clientId: string | null }> {
  const { data } = await supabase
    .from("client_users")
    .select("client_id, clients(name)")
    .eq("user_id", userId)
    .maybeSingle();

  const clientId =
    typeof data?.client_id === "string" ? data.client_id : null;

  const clientsJoin = (data as { clients?: unknown } | null)?.clients as
    | { name?: string | null }
    | { name?: string | null }[]
    | null
    | undefined;
  const record = Array.isArray(clientsJoin) ? clientsJoin[0] : clientsJoin;
  return { organization: record?.name ?? null, clientId };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // Ground context is derived server-side from the session, never trusted
    // from the request body.
    const { organization, clientId } = await resolveClientContext(
      supabase,
      user.id,
    );
    const systemPrompt = buildSystemPrompt(organization);

    if (clientId) {
      await recordLlmPromptEvent(supabase, {
        clientId,
        userId: user.id,
        surface: "client",
      });
    }

    const apiKey = getApiKey();
    const model = resolveModel();

    if (!apiKey) {
      const response: StaffLlmDialogueResponse = {
        reply: buildStubReply(messages, organization),
        model: "preview-stub",
        grounded: Boolean(organization),
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
      grounded: Boolean(organization),
      live: true,
    };

    return NextResponse.json(response);
  } catch (error) {
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
