import type { StaffPlanDashboardKpi } from "@/lib/plan/staff-plan-dashboard-types";
import type { DashboardWidgetView } from "@/lib/widgets/types";

/** Adapt a widget tile into the observe-panel KPI shape. */
export function staffObserveKpiFromWidget(
  widget: DashboardWidgetView,
): StaffPlanDashboardKpi | null {
  if (!widget.client_metric_id) return null;

  return {
    kpi_id: widget.plan_kpi_id ?? widget.id,
    label: widget.label,
    unit: widget.unit,
    client_metric_id: widget.client_metric_id,
    definition_kind: widget.definition_kind ?? "observed",
    stock_flow: widget.stock_flow ?? null,
    baseline_snapshot: null,
    baseline_established: widget.baseline_established,
    current_value: widget.current_value,
    current_value_observed_on: widget.current_value_observed_on,
    target: widget.target ?? "",
    target_value: widget.target_value,
    review_cadence: widget.review_cadence || "monthly",
    source_binding: widget.source_binding ?? "",
    progress_pct: widget.progress_pct,
    at_risk: widget.at_risk,
  };
}
