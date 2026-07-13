export type StaffPlanTaskItem = {
  task_id: string;
  label: string;
  deliverable: string;
  category: string;
  owner: string;
  status: string;
  priority: string;
  is_recurring: boolean;
  is_meeting: boolean;
  initiative_name: string | null;
  /** End of the latest scheduled week (task_week_refs -> plan_weeks). */
  due_date: string | null;
  /** Earliest status-history entry, else plan creation. */
  created_at: string | null;
  /** Newest status-history entry, else completion. */
  last_touched_at: string | null;
  completed_at: string | null;
};

export type StaffPlanTasksResponse = {
  plan_id: string | null;
  tasks: StaffPlanTaskItem[];
};
