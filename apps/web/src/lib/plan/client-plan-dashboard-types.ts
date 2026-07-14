export type ClientPlanWeek = {
  id: string;
  week_id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  is_boundary_week: boolean;
  month_name: string;
  month_theme: string;
  status: "complete" | "active" | "upcoming";
  progress_pct: number;
  task_total: number;
  task_done: number;
};

export type ClientPlanGoal = {
  goal_id: string;
  label: string;
  description: string;
  target: string;
  priority: number;
};

export type ClientPlanInitiative = {
  initiative_id: string;
  label: string;
  owner: string;
  status: string;
  success_criteria: string;
  budget_usd: number | null;
  progress_pct: number;
  task_total: number;
  task_done: number;
};

export type ClientPlanTask = {
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
  initiative_label: string | null;
  week_ids: string[];
};

export type ClientPlanKpi = {
  kpi_id: string;
  label: string;
  unit: string;
  current_value: number | null;
  current_value_observed_on: string | null;
  baseline_established: boolean;
  target: string;
  target_value: number | null;
  progress_pct: number | null;
  at_risk: boolean;
};

export type ClientPlanDashboard = {
  plan: {
    plan_id: string;
    status: string;
    period_start: string;
    period_end: string;
  };
  current_month: {
    name: string;
    theme: string;
  } | null;
  weeks: ClientPlanWeek[];
  goals: ClientPlanGoal[];
  initiatives: ClientPlanInitiative[];
  tasks: ClientPlanTask[];
  kpis: ClientPlanKpi[];
};

export type ClientPlanDashboardResponse =
  | { plan: ClientPlanDashboard }
  | { plan: null };
