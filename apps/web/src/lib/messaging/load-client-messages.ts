import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClientMessage,
  MessageSenderRole,
} from "@/lib/messaging/client-messaging-types";

const MESSAGE_COLUMNS =
  "id, client_id, sender_role, sender_name, body, created_at";
const MESSAGE_HISTORY_LIMIT = 300;

export async function loadClientMessages(
  supabase: SupabaseClient,
  clientId: string,
): Promise<ClientMessage[]> {
  const { data, error } = await supabase
    .from("client_messages")
    .select(MESSAGE_COLUMNS)
    .eq("client_id", clientId)
    .order("created_at", { ascending: true })
    .limit(MESSAGE_HISTORY_LIMIT);

  if (error) {
    throw new Error(`Message query failed: ${error.message}`);
  }

  return (data ?? []) as ClientMessage[];
}

export async function insertClientMessage(
  supabase: SupabaseClient,
  input: {
    clientId: string;
    senderUserId: string;
    senderRole: MessageSenderRole;
    senderName: string;
    body: string;
  },
): Promise<ClientMessage> {
  const { data, error } = await supabase
    .from("client_messages")
    .insert({
      client_id: input.clientId,
      sender_user_id: input.senderUserId,
      sender_role: input.senderRole,
      sender_name: input.senderName,
      body: input.body,
    })
    .select(MESSAGE_COLUMNS)
    .single();

  if (error) {
    throw new Error(`Message send failed: ${error.message}`);
  }

  return data as ClientMessage;
}
