import { NextResponse } from "next/server";
import { requireStaffApiUser, StaffApiAuthError } from "@/lib/auth/staff-api";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import {
  insertClientMessage,
  loadClientMessages,
} from "@/lib/messaging/load-client-messages";
import { MAX_MESSAGE_LENGTH } from "@/lib/messaging/client-messaging-types";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function staffDisplayName(user: {
  user_metadata?: Record<string, unknown>;
  email?: string | null;
}): string {
  const fromMeta = user.user_metadata?.display_name;
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return fromMeta.trim();
  }
  return user.email?.trim() || "Corduroy staff";
}

export async function GET(request: Request) {
  const clientId = new URL(request.url).searchParams.get("client_id")?.trim();

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  try {
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    const messages = await loadClientMessages(supabase, clientId);

    return NextResponse.json({ messages });
  } catch (error) {
    return errorResponse(error, "Message query failed");
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    client_id?: string;
    body?: string;
  };
  const clientId = body.client_id?.trim();
  const text = body.body?.trim();

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  if (!text) {
    return NextResponse.json({ error: "Message body is required" }, { status: 400 });
  }

  try {
    const user = await requireStaffApiUser();
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    const message = await insertClientMessage(supabase, {
      clientId,
      senderUserId: user.id,
      senderRole: "staff",
      senderName: staffDisplayName(user),
      body: text.slice(0, MAX_MESSAGE_LENGTH),
    });

    return NextResponse.json({ message });
  } catch (error) {
    return errorResponse(error, "Message send failed");
  }
}

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof StaffApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallback;
  const status = message.includes("not assigned") ? 403 : 500;
  return NextResponse.json({ error: message }, { status });
}
