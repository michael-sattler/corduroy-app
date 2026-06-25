export type PlanDocument = {
  plan: PlanMeta;
  participants: Participant[];
  clients: PlanClient[];
  phases: Phase[];
  goals: Goal[];
  milestones: Milestone[];
  tasks: Task[];
  kpis: Kpi[];
  risks: Risk[];
};

export type PlanMeta = {
  id: string;
  version: string;
  status: string;
  title: string;
  description: string;
  client_name: string;
  advisor_name: string;
  created_date: string;
  review_date: string;
  period_days: number;
  period_start: string;
  period_end: string;
};

export type Participant = {
  id: string;
  external_user_id: string;
  display_name: string;
  role: string;
  type: string;
};

export type PlanClient = {
  plan_client_id: string;
  external_client_id: string;
  display_name: string;
  type: string;
};

export type Phase = {
  id: string;
  name: string;
  description: string;
  week_start: number;
  week_end: number;
};

export type Goal = {
  id: string;
  name: string;
  description: string;
  initial_status: string;
  current_status: string;
  last_updated: string;
  milestone_ids: string[];
};

export type Milestone = {
  id: string;
  name: string;
  description: string;
  due_date: string;
  initial_status: string;
  current_status: string;
  initial_pct_complete: number;
  current_pct_complete: number;
  last_updated: string;
  phase_id: string;
  goal_ids: string[];
  client_ids: string[];
};

export type Task = {
  id: string;
  name: string;
  description: string;
  assignee_id: string;
  class: string;
  phase_id: string;
  milestone_ids: string[];
  client_ids: string[];
  start_date: string;
  due_date: string;
  duration_days: number;
  initial_status: string;
  current_status: string;
  initial_pct_complete: number;
  current_pct_complete: number;
  last_updated: string;
  notes: string;
};

export type Kpi = {
  id: string;
  name: string;
  description: string;
  unit: string;
  source: string;
  frequency: string;
  target_value: number;
  initial_value: number;
  current_value: number;
  last_updated: string;
  goal_ids: string[];
  client_ids: string[];
};

export type Risk = {
  id: string;
  name: string;
  description: string;
  initial_severity: string;
  current_severity: string;
  initial_likelihood: string;
  current_likelihood: string;
  mitigation: string;
  owner_id: string;
  client_ids: string[];
  last_updated: string;
};

export type PlanWeek = {
  week: number;
  label: string;
  range: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: "complete" | "active" | "upcoming";
};

export type TaskView = {
  id: string;
  title: string;
  tag: string;
  note: string;
  assignee: string;
  accent: string;
  overdue?: boolean;
};
