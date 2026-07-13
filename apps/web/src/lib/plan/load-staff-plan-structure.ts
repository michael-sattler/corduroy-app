import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StaffPlanGoalItem,
  StaffPlanInitiativeItem,
  StaffPlanStructureResponse,
} from "@/lib/plan/staff-plan-structure-types";

type InitiativeRow = {
  id: string;
  initiative_id: string;
  label: string;
  success_criteria: string;
  budget_usd: number | null;
  status: string;
  owner: string;
};

type GoalRow = {
  id: string;
  goal_id: string;
  label: string;
  description: string;
  target: string;
  priority: number;
};

type TaskActivityRow = {
  initiative_id: string | null;
  completed_at: string | null;
  task_status_history: { changed_at: string }[] | null;
};

type GoalMetricRow = {
  plan_goal_id: string;
  plan_kpis:
    | { client_metrics: { last_observed_at: string | null } | null }
    | { client_metrics: { last_observed_at: string | null } | null }[]
    | null;
};

function firstOrValue<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function maxTimestamp(values: (string | null | undefined)[]): string | null {
  let best: string | null = null;
  let bestTime = Number.NEGATIVE_INFINITY;

  for (const value of values) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (Number.isNaN(time)) continue;
    if (time > bestTime) {
      bestTime = time;
      best = value;
    }
  }

  return best;
}

export async function loadStaffPlanStructure(
  supabase: SupabaseClient,
  clientId: string,
): Promise<StaffPlanStructureResponse> {
  const { data: planRow, error: planError } = await supabase
    .from("plans")
    .select("id, plan_id, created_at, generated_at")
    .eq("client_id", clientId)
    .in("status", ["active", "in_review", "draft"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    throw new Error(`Plan query failed: ${planError.message}`);
  }

  if (!planRow) {
    return {
      plan_id: null,
      plan_created_at: null,
      plan_generated_at: null,
      initiatives: [],
      goals: [],
    };
  }

  const plan = planRow as {
    id: string;
    plan_id: string;
    created_at: string;
    generated_at: string;
  };

  const [
    { data: initiativeRows, error: initiativesError },
    { data: goalRows, error: goalsError },
    { data: taskRows, error: tasksError },
  ] = await Promise.all([
    supabase
      .from("plan_initiatives")
      .select("id, initiative_id, label, success_criteria, budget_usd, status, owner")
      .eq("plan_id", plan.id)
      .order("initiative_id"),
    supabase
      .from("plan_goals")
      .select("id, goal_id, label, description, target, priority")
      .eq("plan_id", plan.id)
      .order("priority"),
    supabase
      .from("plan_tasks")
      .select("initiative_id, completed_at, task_status_history ( changed_at )")
      .eq("plan_id", plan.id)
      .not("initiative_id", "is", null),
  ]);

  for (const [label, error] of [
    ["initiatives", initiativesError],
    ["goals", goalsError],
    ["tasks", tasksError],
  ] as const) {
    if (error) {
      throw new Error(`${label} query failed: ${error.message}`);
    }
  }

  const initiativeRowsTyped = (initiativeRows ?? []) as InitiativeRow[];
  const goalRowsTyped = (goalRows ?? []) as GoalRow[];

  // Derive last activity per initiative from its tasks' status history and
  // completion timestamps (plan_initiatives itself has no timestamps).
  const activityByInitiative = new Map<string, (string | null)[]>();
  for (const task of (taskRows ?? []) as TaskActivityRow[]) {
    if (!task.initiative_id) continue;
    const bucket = activityByInitiative.get(task.initiative_id) ?? [];
    bucket.push(task.completed_at);
    for (const history of task.task_status_history ?? []) {
      bucket.push(history.changed_at);
    }
    activityByInitiative.set(task.initiative_id, bucket);
  }

  const initiatives: StaffPlanInitiativeItem[] = initiativeRowsTyped.map(
    (row) => ({
      initiative_id: row.initiative_id,
      label: row.label,
      success_criteria: row.success_criteria,
      budget_usd: row.budget_usd,
      status: row.status,
      owner: row.owner,
      last_activity_at: maxTimestamp(activityByInitiative.get(row.id) ?? []),
    }),
  );

  // Derive last data update per goal from observation freshness of its linked
  // KPIs (kpi_goal_refs -> plan_kpis -> client_metrics.last_observed_at).
  const goalIds = goalRowsTyped.map((row) => row.id);
  const metricByGoal = new Map<string, (string | null)[]>();

  if (goalIds.length > 0) {
    const { data: goalMetricRows, error: goalMetricError } = await supabase
      .from("kpi_goal_refs")
      .select(
        "plan_goal_id, plan_kpis ( client_metrics ( last_observed_at ) )",
      )
      .in("plan_goal_id", goalIds);

    if (goalMetricError) {
      throw new Error(`Goal metric query failed: ${goalMetricError.message}`);
    }

    for (const ref of (goalMetricRows ?? []) as unknown as GoalMetricRow[]) {
      const planKpi = firstOrValue(ref.plan_kpis);
      const metric = planKpi ? firstOrValue(planKpi.client_metrics) : null;
      const bucket = metricByGoal.get(ref.plan_goal_id) ?? [];
      bucket.push(metric?.last_observed_at ?? null);
      metricByGoal.set(ref.plan_goal_id, bucket);
    }
  }

  const goals: StaffPlanGoalItem[] = goalRowsTyped.map((row) => ({
    goal_id: row.goal_id,
    label: row.label,
    description: row.description,
    target: row.target,
    priority: row.priority,
    last_metric_update_at: maxTimestamp(metricByGoal.get(row.id) ?? []),
  }));

  return {
    plan_id: plan.plan_id,
    plan_created_at: plan.created_at ?? null,
    plan_generated_at: plan.generated_at ?? null,
    initiatives,
    goals,
  };
}
