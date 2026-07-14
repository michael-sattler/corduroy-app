import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordLlmPromptEvent(
  supabase: SupabaseClient,
  input: {
    clientId: string;
    userId: string;
    surface: "client" | "staff";
  },
): Promise<void> {
  const { error } = await supabase.from("llm_prompt_events").insert({
    client_id: input.clientId,
    user_id: input.userId,
    surface: input.surface,
  });

  if (error) {
    // Table may not be migrated yet in some environments; never fail the chat.
    console.warn("llm_prompt_events insert failed:", error.message);
  }
}

export async function countLlmPromptEvents(
  supabase: SupabaseClient,
  clientId: string,
  surface?: "client" | "staff",
): Promise<number> {
  let query = supabase
    .from("llm_prompt_events")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  if (surface) {
    query = query.eq("surface", surface);
  }

  const { count, error } = await query;
  if (error) {
    console.warn("llm_prompt_events count failed:", error.message);
    return 0;
  }

  return count ?? 0;
}
