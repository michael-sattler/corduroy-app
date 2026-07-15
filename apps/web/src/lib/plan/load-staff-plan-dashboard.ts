import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computeProgressPct,
} from "@/lib/plan/staff-plan-dashboard-format";
import { computeStaffTaskProgress } from "@/lib/plan/staff-task-progress";
import type {
  StaffPlanDashboard,
  StaffPlanDashboardInitiative,
  StaffPlanDashboardKpi,
  StaffPlanDashboardResponse,
  StaffPlanDashboardTask,
  StaffPlanDashboardTaskCounts,
  StaffPlanFocusWeek,
} from "@/lib/plan/staff-plan-dashboard-types";
import { loadDashboardWidgets } from "@/lib/widgets/load-dashboard-widgets";

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

type PlanWeekInfo = {
  id: string;
  week_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
};

type TaskRow = {
  task_id: string;
  label: string;
  status: string;
  priority: string;
  owner: string;
  category: string;
  initiative_id: string | null;
  task_week_refs:
    | {
        week_id: string | null;
        plan_weeks: PlanWeekInfo | PlanWeekInfo[] | null;
      }[]
    | null;
};

type InitiativeRow = {
  id: string;
  initiative_id: string;
  label: string;
  status: string;
  owner: string;
  budget_usd: number | null;
  success_criteria: string;
};

function firstOrValue<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function taskDueDate(row: TaskRow): string | null {
  let best: string | null = null;
  for (const ref of row.task_week_refs ?? []) {
    const week = firstOrValue(ref.plan_weeks);
    if (!week?.end_date) continue;
    if (!best || week.end_date > best) {
      best = week.end_date;
    }
  }
  return best;
}

function formatWeekTabLabel(weekNumber: number, start: string, end: string): string {
  const startDate = new Date(`${start}T12:00:00`);
  const endDate = new Date(`${end}T12:00:00`);
  const startFmt = startDate.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endFmt =
    startDate.getMonth() === endDate.getMonth()
      ? endDate.toLocaleDateString("en-US", { day: "numeric" })
      : endDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `W${weekNumber} · ${startFmt}–${endFmt}`;
}

function buildFocusWeeks(
  taskRows: TaskRow[],
  weeks: PlanWeekInfo[],
  today: string,
): StaffPlanFocusWeek[] {
  const weekById = new Map(weeks.map((week) => [week.id, week]));
  const tasksByWeek = new Map<string, StaffPlanDashboardTask[]>();

  for (const row of taskRows) {
    const task: StaffPlanDashboardTask = {
      task_id: row.task_id,
      label: row.label,
      status: row.status,
      priority: row.priority,
      owner: row.owner,
      category: row.category,
    };

    const seen = new Set<string>();
    for (const ref of row.task_week_refs ?? []) {
      const week = firstOrValue(ref.plan_weeks);
      const weekId = week?.id ?? ref.week_id;
      if (!weekId || seen.has(weekId)) continue;
      seen.add(weekId);

      const existing = tasksByWeek.get(weekId) ?? [];
      existing.push(task);
      tasksByWeek.set(weekId, existing);
    }
  }

  const priorityRank: Record<string, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...tasksByWeek.entries()]
    .map(([weekId, tasks]) => {
      const week = weekById.get(weekId);
      if (!week) return null;

      const sortedTasks = [...tasks].sort((a, b) => {
        const pa = priorityRank[a.priority] ?? 9;
        const pb = priorityRank[b.priority] ?? 9;
        if (pa !== pb) return pa - pb;
        return a.label.localeCompare(b.label);
      });

      return {
        id: week.id,
        week_id: week.week_id,
        week_number: week.week_number,
        start_date: week.start_date,
        end_date: week.end_date,
        label: formatWeekTabLabel(week.week_number, week.start_date, week.end_date),
        is_current: week.start_date <= today && today <= week.end_date,
        tasks: sortedTasks,
      } satisfies StaffPlanFocusWeek;
    })
    .filter((week): week is StaffPlanFocusWeek => week !== null)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
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
  const widgets = await loadDashboardWidgets(supabase, clientId);

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
    return { plan: null, widgets };
  }

  const plan = planRow as PlanRow;
  const today = new Date().toISOString().slice(0, 10);

  const { data: monthRows, error: monthsError } = await supabase
    .from("plan_months")
    .select("id, name, theme, start_date, end_date")
    .eq("plan_id", plan.id)
    .order("start_date");

  if (monthsError) {
    throw new Error(`months query failed: ${monthsError.message}`);
  }

  const months = monthRows ?? [];
  const monthIds = months.map((month) => month.id as string);
  const currentMonth =
    months.find(
      (month) => month.start_date <= today && today <= month.end_date,
    ) ?? null;

  const [
    { data: goals, error: goalsError },
    { data: kpiRows, error: kpiError },
    { data: initiatives, error: initiativesError },
    { data: tasks, error: tasksError },
    { data: weeks, error: weeksError },
  ] = await Promise.all([
    supabase
      .from("plan_goals")
      .select("goal_id, label, description, target, priority")
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
        "id, initiative_id, label, status, owner, budget_usd, success_criteria",
      )
      .eq("plan_id", plan.id)
      .order("initiative_id"),
    supabase
      .from("plan_tasks")
      .select(
        `
        task_id,
        label,
        status,
        priority,
        owner,
        category,
        initiative_id,
        task_week_refs (
          week_id,
          plan_weeks ( id, week_id, week_number, start_date, end_date )
        )
      `,
      )
      .eq("plan_id", plan.id),
    monthIds.length > 0
      ? supabase
          .from("plan_weeks")
          .select("id, week_id, week_number, start_date, end_date")
          .in("month_id", monthIds)
          .order("start_date")
      : Promise.resolve({ data: [] as PlanWeekInfo[], error: null }),
  ]);

  for (const [label, error] of [
    ["goals", goalsError],
    ["kpis", kpiError],
    ["initiatives", initiativesError],
    ["tasks", tasksError],
    ["weeks", weeksError],
  ] as const) {
    if (error) {
      throw new Error(`${label} query failed: ${error.message}`);
    }
  }

  const taskRows = (tasks ?? []) as TaskRow[];
  const weekRows = (weeks ?? []) as PlanWeekInfo[];
  const mappedTasks: StaffPlanDashboardTask[] = taskRows.map((row) => ({
    task_id: row.task_id,
    label: row.label,
    status: row.status,
    priority: row.priority,
    owner: row.owner,
    category: row.category,
  }));
  // Plan KPI rows kept for plan editors / observe fallbacks; tiles use `widgets`.
  const mappedKpis = ((kpiRows ?? []) as KpiRow[]).map(mapKpi);

  const taskProgress = computeStaffTaskProgress(
    taskRows.map((row) => ({
      status: row.status,
      due_date: taskDueDate(row),
    })),
    weekRows,
    today,
  );

  const focusWeeks = buildFocusWeeks(taskRows, weekRows, today);

  const mappedInitiatives: StaffPlanDashboardInitiative[] = (
    (initiatives ?? []) as InitiativeRow[]
  ).map((initiative) => {
    const initiativeTasks = taskRows.filter(
      (task) => task.initiative_id === initiative.id,
    );
    const taskDone = initiativeTasks.filter(
      (task) => task.status === "done",
    ).length;
    const taskTotal = initiativeTasks.length;

    return {
      initiative_id: initiative.initiative_id,
      label: initiative.label,
      status: initiative.status,
      owner: initiative.owner,
      budget_usd: initiative.budget_usd,
      success_criteria: initiative.success_criteria,
      progress_pct:
        taskTotal === 0 ? 0 : Math.round((taskDone / taskTotal) * 100),
      task_total: taskTotal,
      task_done: taskDone,
    };
  });

  const dashboard: StaffPlanDashboard = {
    plan: {
      plan_id: plan.plan_id,
      status: plan.status,
      period_start: plan.period_start,
      period_end: plan.period_end,
      schema_version: plan.schema_version,
    },
    current_month: currentMonth
      ? { name: currentMonth.name, theme: currentMonth.theme }
      : null,
    goals: goals ?? [],
    kpis: mappedKpis,
    initiatives: mappedInitiatives,
    task_counts: countTasks(mappedTasks),
    task_progress: taskProgress,
    focus_tasks: pickFocusTasks(mappedTasks),
    focus_weeks: focusWeeks,
  };

  return { plan: dashboard, widgets };
}
