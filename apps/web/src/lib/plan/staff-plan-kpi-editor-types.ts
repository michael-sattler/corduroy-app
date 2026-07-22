export type StaffPlanKpiEditorItem = {
  kpi_id: string;
  client_metric_id: string | null;
  label: string;
  unit: string;
  metric_tier: string;
  definition_kind: string;
  stock_flow: string | null;
  source_binding: string;
  current_value: number | null;
  current_value_observed_on: string | null;
  last_observed_at: string | null;
  is_active: boolean;
  baseline_snapshot: number | null;
  baseline_established: boolean;
  target: string;
  target_value: number | null;
  review_cadence: string;
};

export type StaffPlanKpiEditorResponse = {
  plan_id: string | null;
  kpis: StaffPlanKpiEditorItem[];
};
