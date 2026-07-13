import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeProgressPct,
} from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffPlanDashboard,
  StaffPlanDashboardInitiative,
  StaffPlanDashboardKpi,
  StaffPlanDashboardResponse,
  StaffPlanDashboardTask,
  StaffPlanDashboardTaskCounts,
} from "@/lib/plan/staff-plan-dashboard-types";

type PlanRow = {
  id: string;
  plan_id: string;
  status: string;
  period_start: string;
  period_end: string;
  schema_version: string;
};

type KpiDefinition = {
  id: string;
  metric_key: string;
  label: string;
  unit: string;
  kind: string;
  stock_flow: string | null;
};

type KpiClientMetric = {
  id: string;
  current_value: number | null;
  current_value_observed_on: string | null;
  source_binding: string;
  metric_definitions: KpiDefinition | KpiDefinition[] | null;
};

type KpiRow = {
  kpi_id: string;
  baseline_snapshot: number | null;
  baseline_established: boolean;
  target: string;
  target_value: number | null;
  review_cadence: string;
  client_metrics: KpiClientMetric | KpiClientMetric[] | null;
};

function clientMetricForKpi(row: KpiRow) {
  const metrics = row.client_metrics;
  if (!metrics) return null;
  return Array.isArray(metrics) ? (metrics[0] ?? null) : metrics;
}

function metricDefinitionForKpi(
  metric: NonNullable<ReturnType<typeof clientMetricForKpi>>,
) {
  const definition = metric.metric_definitions;
  if (!definition) return null;
  return Array.isArray(definition) ? (definition[0] ?? null) : definition;
}

function emptyTaskCounts(): StaffPlanDashboardTaskCounts {
  return {
    total: 0,
    not_started: 0,
    in_progress: 0,
    done: 0,
    blocked: 0,
    skipped: 0,
  };
}

function countTasks(tasks: { status: string }[]): StaffPlanDashboardTaskCounts {
  const counts = emptyTaskCounts();
  counts.total = tasks.length;

  for (const task of tasks) {
    if (task.status in counts) {
      counts[task.status as keyof Omit<StaffPlanDashboardTaskCounts, "total">] += 1;
    }
  }

  return counts;
}

function mapKpi(row: KpiRow): StaffPlanDashboardKpi {
  const clientMetric = clientMetricForKpi(row);
  const definition = clientMetric
    ? metricDefinitionForKpi(clientMetric)
    : null;
  const label = definition?.label ?? row.kpi_id;
  const unit = definition?.unit ?? "ratio";
  const current = clientMetric?.current_value ?? null;
  const progress = computeProgressPct(
    row.baseline_snapshot,
    current,
    row.target_value,
  );

  const at_risk =
    row.baseline_established &&
    progress !== null &&
    progress < 40 &&
    row.target_value !== null;

  return {
    kpi_id: row.kpi_id,
    label,
    unit,
    client_metric_id: clientMetric?.id ?? null,
    definition_kind: definition?.kind ?? "observed",
    stock_flow: definition?.stock_flow ?? null,
    baseline_snapshot: row.baseline_snapshot,
    baseline_established: row.baseline_established,
    current_value: current,
    current_value_observed_on:
      clientMetric?.current_value_observed_on ?? null,
    target: row.target,
    target_value: row.target_value,
    review_cadence: row.review_cadence,
    source_binding: clientMetric?.source_binding ?? "",
    progress_pct: progress,
    at_risk: at_risk,
  };
}

function pickFocusTasks(tasks: StaffPlanDashboardTask[]): StaffPlanDashboardTask[] {
  const priorityRank: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...tasks]
    .filter((task) => task.status !== "done" && task.status !== "skipped")
    .sort((a, b) => {
      const pa = priorityRank[a.priority] ?? 9;
      const pb = priorityRank[b.priority] ?? 9;
      if (pa !== pb) return pa - pb;
      return a.label.localeCompare(b.label);
    })
    .slice(0, 6);
}

export async function loadStaffPlanDashboard(
  supabase: SupabaseClient,
  clientId: string,
): Promise<StaffPlanDashboardResponse> {
  const { data: planRow, error: planError } = await supabase
    .from("plans")
    .select("id, plan_id, status, period_start, period_end, schema_version")
    .eq("client_id", clientId)
    .in("status", ["active", "in_review", "draft"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    throw new Error(`Plan query failed: ${planError.message}`);
  }

  if (!planRow) {
    return { plan: null };
  }

  const plan = planRow as PlanRow;
  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: months, error: monthsError },
    { data: goals, error: goalsError },
    { data: kpiRows, error: kpiError },
    { data: initiatives, error: initiativesError },
    { data: tasks, error: tasksError },
  ] = await Promise.all([
    supabase
      .from("plan_months")
      .select("name, theme, start_date, end_date")
      .eq("plan_id", plan.id)
      .lte("start_date", today)
      .gte("end_date", today)
      .maybeSingle(),
    supabase
      .from("plan_goals")
      .select("goal_id, label, target, priority")
      .eq("plan_id", plan.id)
      .order("priority"),
    supabase
      .from("plan_kpis")
      .select(
        `
        kpi_id,
        baseline_snapshot,
        baseline_established,
        target,
        target_value,
        review_cadence,
        client_metrics (
          id,
          current_value,
          current_value_observed_on,
          source_binding,
          metric_definitions (
            id,
            metric_key,
            label,
            unit,
            kind,
            stock_flow
          )
        )
      `,
      )
      .eq("plan_id", plan.id)
      .order("kpi_id"),
    supabase
      .from("plan_initiatives")
      .select(
        "initiative_id, label, status, owner, budget_usd, success_criteria",
      )
      .eq("plan_id", plan.id)
      .order("initiative_id"),
    supabase
      .from("plan_tasks")
      .select("task_id, label, status, priority, owner, category")
      .eq("plan_id", plan.id),
  ]);

  for (const [label, error] of [
    ["months", monthsError],
    ["goals", goalsError],
    ["kpis", kpiError],
    ["initiatives", initiativesError],
    ["tasks", tasksError],
  ] as const) {
    if (error) {
      throw new Error(`${label} query failed: ${error.message}`);
    }
  }

  const mappedTasks = (tasks ?? []) as StaffPlanDashboardTask[];
  const mappedKpis = ((kpiRows ?? []) as KpiRow[]).map(mapKpi);

  const featuredKpiIds = [
    "kpi-005",
    "kpi-004",
    "kpi-006",
    "kpi-013",
    "kpi-001",
    "kpi-010",
  ];
  const kpiById = new Map(mappedKpis.map((k) => [k.kpi_id, k]));
  const featuredKpis = [
    ...featuredKpiIds
      .map((id) => kpiById.get(id))
      .filter((k): k is StaffPlanDashboardKpi => k !== undefined),
    ...mappedKpis.filter((k) => !featuredKpiIds.includes(k.kpi_id)),
  ].slice(0, 8);

  const dashboard: StaffPlanDashboard = {
    plan: {
      plan_id: plan.plan_id,
      status: plan.status,
      period_start: plan.period_start,
      period_end: plan.period_end,
      schema_version: plan.schema_version,
    },
    current_month: months
      ? { name: months.name, theme: months.theme }
      : null,
    goals: goals ?? [],
    kpis: featuredKpis,
    initiatives: (initiatives ?? []) as StaffPlanDashboardInitiative[],
    task_counts: countTasks(mappedTasks),
    focus_tasks: pickFocusTasks(mappedTasks),
  };

  return { plan: dashboard };
}
