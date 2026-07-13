export type StaffPlanInitiativeItem = {
  initiative_id: string;
  label: string;
  success_criteria: string;
  budget_usd: number | null;
  status: string;
  owner: string;
  /** Newest linked task status change / completion, if any. */
  last_activity_at: string | null;
};

export type StaffPlanGoalItem = {
  goal_id: string;
  label: string;
  description: string;
  target: string;
  priority: number;
  /** Newest observation on a KPI linked to this goal, if any. */
  last_metric_update_at: string | null;
};

export type StaffPlanStructureResponse = {
  plan_id: string | null;
  plan_created_at: string | null;
  plan_generated_at: string | null;
  initiatives: StaffPlanInitiativeItem[];
  goals: StaffPlanGoalItem[];
};

export const INITIATIVE_STATUSES = [
  "not_started",
  "in_progress",
  "done",
  "blocked",
] as const;

export const INITIATIVE_OWNERS = ["client", "corduroy", "both"] as const;

export const GOAL_PRIORITIES = [1, 2, 3, 4, 5] as const;

export type StaffPlanInitiativePatch = {
  label: string;
  success_criteria: string;
  budget_usd: number | null;
  status: string;
  owner: string;
};

export type StaffPlanGoalPatch = {
  label: string;
  description: string;
  target: string;
  priority: number;
};

/** Editable fields returned by the structure PATCH endpoint. */
export type StaffPlanInitiativeUpdateResponse = {
  initiative: StaffPlanInitiativePatch & { initiative_id: string };
};

export type StaffPlanGoalUpdateResponse = {
  goal: StaffPlanGoalPatch & { goal_id: string };
};
