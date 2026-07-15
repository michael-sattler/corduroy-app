import type { ClientPlanKpi } from "@/lib/plan/client-plan-dashboard-types";
import type { StaffPlanDashboardKpi } from "@/lib/plan/staff-plan-dashboard-types";
import type { DashboardWidgetView } from "@/lib/widgets/types";

/** Bridge current plan-KPI loaders into the widget DTO (pre–dashboard_widgets). */
/** @deprecated Prefer loadDashboardWidgets — kept for ad-hoc adapters. */
export function widgetFromClientPlanKpi(kpi: ClientPlanKpi): DashboardWidgetView {
  return {
    id: kpi.kpi_id,
    client_metric_id: null,
    widget_type: "single_stat",
    palette: "default",
    label: kpi.label,
    unit: kpi.unit,
    current_value: kpi.current_value,
    current_value_observed_on: kpi.current_value_observed_on,
    target: kpi.target,
    target_value: kpi.target_value,
    baseline_established: kpi.baseline_established,
    progress_pct: kpi.progress_pct,
    at_risk: kpi.at_risk,
  };
}

/** @deprecated Prefer loadDashboardWidgets — kept for ad-hoc adapters. */
export function widgetFromStaffPlanKpi(
  kpi: StaffPlanDashboardKpi,
): DashboardWidgetView {
  return {
    id: kpi.kpi_id,
    client_metric_id: kpi.client_metric_id,
    widget_type: "single_stat",
    palette: "default",
    label: kpi.label,
    unit: kpi.unit,
    current_value: kpi.current_value,
    current_value_observed_on: kpi.current_value_observed_on,
    target: kpi.target,
    target_value: kpi.target_value,
    baseline_established: kpi.baseline_established,
    progress_pct: kpi.progress_pct,
    at_risk: kpi.at_risk,
    definition_kind: kpi.definition_kind,
    stock_flow: kpi.stock_flow,
    review_cadence: kpi.review_cadence,
    source_binding: kpi.source_binding,
    plan_kpi_id: kpi.kpi_id,
  };
}
