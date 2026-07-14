import type { StaffPlanTaskProgress } from "@/lib/plan/staff-task-progress";

export type { StaffPlanTaskProgress } from "@/lib/plan/staff-task-progress";

export type StaffPlanDashboardKpi = {
  kpi_id: string;
  label: string;
  unit: string;
  client_metric_id: string | null;
  definition_kind: string;
  stock_flow: string | null;
  baseline_snapshot: number | null;
  baseline_established: boolean;
  current_value: number | null;
  current_value_observed_on: string | null;
  target: string;
  target_value: number | null;
  review_cadence: string;
  source_binding: string;
  progress_pct: number | null;
  at_risk: boolean;
};

export type StaffPlanDashboardInitiative = {
  initiative_id: string;
  label: string;
  status: string;
  owner: string;
  budget_usd: number | null;
  success_criteria: string;
  progress_pct: number;
  task_total: number;
  task_done: number;
};

export type StaffPlanDashboardGoal = {
  goal_id: string;
  label: string;
  description: string;
  target: string;
  priority: number;
};

export type StaffPlanDashboardTask = {
  task_id: string;
  label: string;
  status: string;
  priority: string;
  owner: string;
  category: string;
};

export type StaffPlanFocusWeek = {
  id: string;
  week_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  label: string;
  is_current: boolean;
  tasks: StaffPlanDashboardTask[];
};

export type StaffPlanDashboardTaskCounts = {
  total: number;
  not_started: number;
  in_progress: number;
  done: number;
  blocked: number;
  skipped: number;
};

export type StaffPlanDashboard = {
  plan: {
    plan_id: string;
    status: string;
    period_start: string;
    period_end: string;
    schema_version: string;
  };
  current_month: {
    name: string;
    theme: string;
  } | null;
  goals: StaffPlanDashboardGoal[];
  kpis: StaffPlanDashboardKpi[];
  initiatives: StaffPlanDashboardInitiative[];
  task_counts: StaffPlanDashboardTaskCounts;
  task_progress: StaffPlanTaskProgress;
  focus_tasks: StaffPlanDashboardTask[];
  focus_weeks: StaffPlanFocusWeek[];
};

export type StaffPlanDashboardResponse =
  | { plan: StaffPlanDashboard }
  | { plan: null };
