import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ClientProfile = {
  client_id: string;
  display_name: string;
};

type TaskUpdateBody = {
  task_id?: string;
  status?: string;
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

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as TaskUpdateBody;
  const taskId = body.task_id?.trim();
  const status = body.status?.trim();

  if (!taskId) {
    return NextResponse.json({ error: "task_id is required" }, { status: 400 });
  }

  if (status !== "done") {
    return NextResponse.json(
      { error: "Only status 'done' is supported" },
      { status: 400 },
    );
  }

  const resolved = await resolveClientProfile();
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  const admin = createServiceRoleClient();

  const { data: planRow, error: planError } = await admin
    .from("plans")
    .select("id")
    .eq("client_id", resolved.profile.client_id)
    .in("status", ["active", "in_review", "draft"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    return NextResponse.json({ error: planError.message }, { status: 500 });
  }

  if (!planRow) {
    return NextResponse.json({ error: "No active plan found" }, { status: 404 });
  }

  const planId = (planRow as { id: string }).id;

  const { data: taskRow, error: taskError } = await admin
    .from("plan_tasks")
    .select("id, status, completed_at")
    .eq("plan_id", planId)
    .eq("id", taskId)
    .maybeSingle();

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 });
  }

  if (!taskRow) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const task = taskRow as {
    id: string;
    status: string;
    completed_at: string | null;
  };

  if (task.status === "done") {
    return NextResponse.json({
      task: {
        id: task.id,
        status: task.status,
        completed_at: task.completed_at,
      },
    });
  }

  const completedAt = new Date().toISOString();
  const statusFrom = task.status;

  const { data: updated, error: updateError } = await admin
    .from("plan_tasks")
    .update({
      status: "done",
      completed_at: completedAt,
    })
    .eq("id", task.id)
    .eq("plan_id", planId)
    .select("id, status, completed_at")
    .maybeSingle();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const { error: historyError } = await admin.from("task_status_history").insert({
    plan_task_id: task.id,
    status_from: statusFrom,
    status_to: "done",
    changed_by: resolved.profile.display_name || resolved.userId,
    change_source: "manual_client",
  });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  return NextResponse.json({ task: updated });
}
