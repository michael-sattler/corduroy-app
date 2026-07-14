import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { countLlmPromptEvents } from "@/lib/llm/llm-prompt-events";
import type { StaffClientActivity } from "@/lib/staff-client-activity-types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type { StaffClientActivity } from "@/lib/staff-client-activity-types";

function tryServiceRoleClient() {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

async function countClientDialogueMessages(
  supabase: SupabaseClient,
  clientId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("client_messages")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId)
    .eq("sender_role", "client");

  if (error) {
    throw new Error(`Dialogue message count failed: ${error.message}`);
  }

  return count ?? 0;
}

async function countCompletedTasks(
  supabase: SupabaseClient,
  clientId: string,
): Promise<number> {
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select("id")
    .eq("client_id", clientId)
    .in("status", ["active", "in_review", "draft"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    throw new Error(`Plan lookup failed: ${planError.message}`);
  }

  if (!plan) {
    return 0;
  }

  const { count, error } = await supabase
    .from("plan_tasks")
    .select("id", { count: "exact", head: true })
    .eq("plan_id", plan.id)
    .eq("status", "done");

  if (error) {
    throw new Error(`Completed task count failed: ${error.message}`);
  }

  return count ?? 0;
}

async function latestClientLoginAt(clientId: string): Promise<string | null> {
  const admin = tryServiceRoleClient();
  if (!admin) {
    return null;
  }

  const { data: members, error } = await admin
    .from("client_users")
    .select("user_id")
    .eq("client_id", clientId);

  if (error || !members?.length) {
    return null;
  }

  let latest: string | null = null;

  await Promise.all(
    members.map(async (member) => {
      const { data, error: userError } = await admin.auth.admin.getUserById(
        member.user_id,
      );
      if (userError || !data.user?.last_sign_in_at) {
        return;
      }

      if (!latest || data.user.last_sign_in_at > latest) {
        latest = data.user.last_sign_in_at;
      }
    }),
  );

  return latest;
}

export async function loadStaffClientActivity(
  supabase: SupabaseClient,
  clientId: string,
): Promise<StaffClientActivity> {
  const [dialogue_messages_sent, llm_messages_sent, tasks_completed, last_login_at] =
    await Promise.all([
      countClientDialogueMessages(supabase, clientId),
      countLlmPromptEvents(supabase, clientId, "client"),
      countCompletedTasks(supabase, clientId),
      latestClientLoginAt(clientId),
    ]);

  return {
    dialogue_messages_sent,
    llm_messages_sent,
    tasks_completed,
    last_login_at,
  };
}
