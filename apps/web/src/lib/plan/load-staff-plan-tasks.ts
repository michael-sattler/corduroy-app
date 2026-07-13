import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StaffPlanTaskItem,
  StaffPlanTasksResponse,
} from "@/lib/plan/staff-plan-tasks-types";

type PlanWeek = { start_date: string; end_date: string };

type TaskRow = {
  task_id: string;
  label: string;
  deliverable: string;
  category: string;
  owner: string;
  status: string;
  priority: string;
  is_recurring: boolean;
  is_meeting: boolean;
  completed_at: string | null;
  plan_initiatives: { label: string } | { label: string }[] | null;
  task_status_history: { changed_at: string }[] | null;
  task_week_refs:
    | { plan_weeks: PlanWeek | PlanWeek[] | null }[]
    | null;
};

function firstOrValue<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function extremeTimestamp(
  values: (string | null | undefined)[],
  mode: "min" | "max",
): string | null {
  let best: string | null = null;
  let bestTime = mode === "min" ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) continue;
    if (mode === "min" ? time < bestTime : time > bestTime) {
      bestTime = time;
      best = value;
    }
  }

  return best;
}

const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

function compareTasks(a: StaffPlanTaskItem, b: StaffPlanTaskItem): number {
  // Ascending by due date; tasks without a due date sort to the end.
  const at = a.due_date ? new Date(a.due_date).getTime() : Number.POSITIVE_INFINITY;
  const bt = b.due_date ? new Date(b.due_date).getTime() : Number.POSITIVE_INFINITY;
  if (at !== bt) return at - bt;

  const ap = PRIORITY_RANK[a.priority] ?? 9;
  const bp = PRIORITY_RANK[b.priority] ?? 9;
  if (ap !== bp) return ap - bp;

  return a.label.localeCompare(b.label);
}

function mapTask(row: TaskRow, planCreatedAt: string | null): StaffPlanTaskItem {
  const initiative = firstOrValue(row.plan_initiatives);

  const weekEnds: (string | null)[] = [];
  for (const ref of row.task_week_refs ?? []) {
    const week = firstOrValue(ref.plan_weeks);
    if (week) weekEnds.push(week.end_date);
  }

  const historyStamps = (row.task_status_history ?? []).map((h) => h.changed_at);

  const created =
    extremeTimestamp(historyStamps, "min") ?? planCreatedAt ?? null;
  const lastTouched =
    extremeTimestamp([...historyStamps, row.completed_at], "max") ?? null;

  return {
    task_id: row.task_id,
    label: row.label,
    deliverable: row.deliverable,
    category: row.category,
    owner: row.owner,
    status: row.status,
    priority: row.priority,
    is_recurring: row.is_recurring,
    is_meeting: row.is_meeting,
    initiative_name: initiative?.label ?? null,
    due_date: extremeTimestamp(weekEnds, "max"),
    created_at: created,
    last_touched_at: lastTouched,
    completed_at: row.completed_at,
  };
}

export async function loadStaffPlanTasks(
  supabase: SupabaseClient,
  clientId: string,
): Promise<StaffPlanTasksResponse> {
  const { data: planRow, error: planError } = await supabase
    .from("plans")
    .select("id, plan_id, created_at")
    .eq("client_id", clientId)
    .in("status", ["active", "in_review", "draft"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    throw new Error(`Plan query failed: ${planError.message}`);
  }

  if (!planRow) {
    return { plan_id: null, tasks: [] };
  }

  const plan = planRow as { id: string; plan_id: string; created_at: string };

  const { data: taskRows, error: tasksError } = await supabase
    .from("plan_tasks")
    .select(
      `
      task_id,
      label,
      deliverable,
      category,
      owner,
      status,
      priority,
      is_recurring,
      is_meeting,
      completed_at,
      plan_initiatives ( label ),
      task_status_history ( changed_at ),
      task_week_refs ( plan_weeks ( start_date, end_date ) )
    `,
    )
    .eq("plan_id", plan.id);

  if (tasksError) {
    throw new Error(`Tasks query failed: ${tasksError.message}`);
  }

  const tasks = ((taskRows ?? []) as unknown as TaskRow[])
    .map((row) => mapTask(row, plan.created_at ?? null))
    .sort(compareTasks);

  return { plan_id: plan.plan_id, tasks };
}
