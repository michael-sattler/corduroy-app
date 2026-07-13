import { NextResponse } from "next/server";
import {
  insertClientMessage,
  loadClientMessages,
} from "@/lib/messaging/load-client-messages";
import { MAX_MESSAGE_LENGTH } from "@/lib/messaging/client-messaging-types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClientProfile = {
  client_id: string;
  display_name: string;
};

async function resolveClientProfile(): Promise<
  | { ok: true; userId: string; profile: ClientProfile }
  | { ok: false; status: number; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const { data, error } = await supabase
    .from("client_users")
    .select("client_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, error: error.message };
  }

  if (!data) {
    return { ok: false, status: 403, error: "No client profile for this account" };
  }

  return {
    ok: true,
    userId: user.id,
    profile: data as ClientProfile,
  };
}

export async function GET() {
  const resolved = await resolveClientProfile();
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    const supabase = await createClient();
    const messages = await loadClientMessages(supabase, resolved.profile.client_id);
    return NextResponse.json({ messages });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Message query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { body?: string };
  const text = body.body?.trim();

  if (!text) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  }

  const resolved = await resolveClientProfile();
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  try {
    const supabase = await createClient();
    const message = await insertClientMessage(supabase, {
      clientId: resolved.profile.client_id,
      senderUserId: resolved.userId,
      senderRole: "client",
      senderName: resolved.profile.display_name || "Client",
      body: text.slice(0, MAX_MESSAGE_LENGTH),
    });

    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Message send failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
