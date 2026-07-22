import type { MetricWidgetType } from "@/lib/metric-catalog-types";

/** What the loader must fetch for a kind to render usefully. */
export type WidgetDataNeeds = "current" | "series" | "plan_target";

export type DashboardWidgetSeriesPoint = {
  observed_on: string;
  period_end: string;
  value: number;
};

/**
 * Presentation DTO for one dashboard tile.
 * Loaded from `dashboard_widgets` ⋈ `client_metrics` ⋈ `metric_definitions`
 * (+ `plan_kpis` / series when the kind needs them).
 */
export type DashboardWidgetView = {
  id: string;
  client_metric_id: string | null;
  widget_type: MetricWidgetType | string;
  palette: string;
  label: string;
  unit: string;
  current_value: number | null;
  current_value_observed_on: string | null;
  last_observed_at?: string | null;
  /** Display string for the plan target, when known. */
  target: string | null;
  target_value: number | null;
  baseline_snapshot?: number | null;
  baseline_established: boolean;
  progress_pct: number | null;
  at_risk: boolean;
  series?: DashboardWidgetSeriesPoint[];
  /** Staff observe affordance metadata. */
  definition_kind?: string;
  stock_flow?: string | null;
  review_cadence?: string;
  plan_period_start?: string | null;
  plan_period_end?: string | null;
  source_binding?: string;
  plan_kpi_id?: string | null;
};
