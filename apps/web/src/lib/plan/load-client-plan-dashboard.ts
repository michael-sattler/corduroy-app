import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ClientPlanDashboard,
  ClientPlanDashboardResponse,
  ClientPlanGoal,
  ClientPlanInitiative,
  ClientPlanTask,
  ClientPlanWeek,
} from "@/lib/plan/client-plan-dashboard-types";
import { loadDashboardWidgets } from "@/lib/widgets/load-dashboard-widgets";

type PlanRow = {
  id: string;
  plan_id: string;
  status: string;
  period_start: string;
  period_end: string;
};

type MonthRow = {
  id: string;
  name: string;
  theme: string;
  start_date: string;
  end_date: string;
};

type WeekRow = {
  id: string;
  week_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  is_boundary_week: boolean;
  month_id: string;
};

type InitiativeRow = {
  id: string;
  initiative_id: string;
  label: string;
  owner: string;
  status: string;
  success_criteria: string;
  budget_usd: number | null;
};

type TaskRow = {
  id: string;
  task_id: string;
  label: string;
  category: string;
  owner: string;
  status: string;
  priority: string;
  is_recurring: boolean;
  is_meeting: boolean;
  deliverable: string;
  completed_at: string | null;
  initiative_id: string | null;
  plan_initiatives: { label: string } | { label: string }[] | null;
  task_week_refs: { week_id: string }[] | null;
};

function firstOrValue<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function weekStatus(
  todayIso: string,
  startDate: string,
  endDate: string,
): ClientPlanWeek["status"] {
  if (todayIso > endDate) return "complete";
  if (todayIso >= startDate && todayIso <= endDate) return "active";
  return "upcoming";
}

async function resolveClientId(supabase: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("client_users")
    .select("client_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`Client membership query failed: ${error.message}`);
  }

  return (data?.client_id as string | undefined) ?? null;
}

export async function loadClientPlanDashboard(
  supabase: SupabaseClient,
): Promise<ClientPlanDashboardResponse> {
  const clientId = await resolveClientId(supabase);
  const widgets = clientId
    ? await loadDashboardWidgets(supabase, clientId)
    : [];

  const { data: planRow, error: planError } = await supabase
    .from("plans")
    .select("id, plan_id, status, period_start, period_end")
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

  const { data: monthRows, error: monthsError } = await supabase
    .from("plan_months")
    .select("id, name, theme, start_date, end_date")
    .eq("plan_id", plan.id)
    .order("start_date");

  if (monthsError) {
    throw new Error(`Months query failed: ${monthsError.message}`);
  }

  const months = (monthRows ?? []) as MonthRow[];
  const monthById = new Map(months.map((m) => [m.id, m]));
  const monthIds = months.map((m) => m.id);

  const [
    { data: weekRows, error: weeksError },
    { data: goalRows, error: goalsError },
    { data: initiativeRows, error: initiativesError },
    { data: taskRows, error: tasksError },
  ] = await Promise.all([
    monthIds.length > 0
      ? supabase
          .from("plan_weeks")
          .select(
            "id, week_id, week_number, start_date, end_date, is_boundary_week, month_id",
          )
          .in("month_id", monthIds)
          .order("week_number")
      : Promise.resolve({ data: [] as WeekRow[], error: null }),
    supabase
      .from("plan_goals")
      .select("goal_id, label, description, target, priority")
      .eq("plan_id", plan.id)
      .order("priority"),
    supabase
      .from("plan_initiatives")
      .select(
        "id, initiative_id, label, owner, status, success_criteria, budget_usd",
      )
      .eq("plan_id", plan.id)
      .order("initiative_id"),
    supabase
      .from("plan_tasks")
      .select(
        `
        id,
        task_id,
        label,
        category,
        owner,
        status,
        priority,
        is_recurring,
        is_meeting,
        deliverable,
        completed_at,
        initiative_id,
        plan_initiatives ( label ),
        task_week_refs ( week_id )
      `,
      )
      .eq("plan_id", plan.id),
  ]);

  for (const [label, error] of [
    ["weeks", weeksError],
    ["goals", goalsError],
    ["initiatives", initiativesError],
    ["tasks", tasksError],
  ] as const) {
    if (error) {
      throw new Error(`${label} query failed: ${error.message}`);
    }
  }

  const tasks = (taskRows ?? []) as unknown as TaskRow[];

  const tasksByWeekId = new Map<string, TaskRow[]>();
  for (const task of tasks) {
    for (const ref of task.task_week_refs ?? []) {
      const list = tasksByWeekId.get(ref.week_id) ?? [];
      list.push(task);
      tasksByWeekId.set(ref.week_id, list);
    }
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  const weeks: ClientPlanWeek[] = ((weekRows ?? []) as WeekRow[]).map((w) => {
    const month = monthById.get(w.month_id);
    const weekTasks = tasksByWeekId.get(w.id) ?? [];
    const doneCount = weekTasks.filter((t) => t.status === "done").length;

    return {
      id: w.id,
      week_id: w.week_id,
      week_number: w.week_number,
      start_date: w.start_date,
      end_date: w.end_date,
      is_boundary_week: w.is_boundary_week,
      month_name: month?.name ?? "",
      month_theme: month?.theme ?? "",
      status: weekStatus(todayIso, w.start_date, w.end_date),
      progress_pct:
        weekTasks.length === 0
          ? 0
          : Math.round((doneCount / weekTasks.length) * 100),
      task_total: weekTasks.length,
      task_done: doneCount,
    };
  });

  const initiatives: ClientPlanInitiative[] = (
    (initiativeRows ?? []) as InitiativeRow[]
  ).map((i) => {
    const initiativeTasks = tasks.filter((t) => t.initiative_id === i.id);
    const doneCount = initiativeTasks.filter((t) => t.status === "done").length;

    return {
      initiative_id: i.initiative_id,
      label: i.label,
      owner: i.owner,
      status: i.status,
      success_criteria: i.success_criteria,
      budget_usd: i.budget_usd,
      progress_pct:
        initiativeTasks.length === 0
          ? 0
          : Math.round((doneCount / initiativeTasks.length) * 100),
      task_total: initiativeTasks.length,
      task_done: doneCount,
    };
  });

  const mappedTasks: ClientPlanTask[] = tasks.map((t) => ({
    id: t.id,
    task_id: t.task_id,
    label: t.label,
    category: t.category,
    owner: t.owner,
    status: t.status,
    priority: t.priority,
    is_recurring: t.is_recurring,
    is_meeting: t.is_meeting,
    deliverable: t.deliverable,
    completed_at: t.completed_at,
    initiative_label: firstOrValue(t.plan_initiatives)?.label ?? null,
    week_ids: (t.task_week_refs ?? []).map((r) => r.week_id),
  }));

  const currentMonth =
    months.find((m) => todayIso >= m.start_date && todayIso <= m.end_date) ??
    null;

  const dashboard: ClientPlanDashboard = {
    plan: {
      plan_id: plan.plan_id,
      status: plan.status,
      period_start: plan.period_start,
      period_end: plan.period_end,
    },
    current_month: currentMonth
      ? { name: currentMonth.name, theme: currentMonth.theme }
      : null,
    weeks,
    goals: (goalRows ?? []) as ClientPlanGoal[],
    initiatives,
    tasks: mappedTasks,
    kpis: [],
  };

  return { plan: dashboard, widgets };
}
