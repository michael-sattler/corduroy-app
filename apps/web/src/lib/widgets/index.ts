export type {
  DashboardWidgetSeriesPoint,
  DashboardWidgetView,
  WidgetDataNeeds,
} from "@/lib/widgets/types";
export {
  widgetFromClientPlanKpi,
  widgetFromStaffPlanKpi,
} from "@/lib/widgets/from-plan-kpi";
export {
  listWidgetKinds,
  resolveWidgetKind,
  type WidgetKindMeta,
} from "@/lib/widgets/resolve-kind";
export type {
  StaffClientMetricOption,
  StaffDashboardWidgetCreateInput,
  StaffDashboardWidgetEditorItem,
  StaffDashboardWidgetPatchInput,
  StaffDashboardWidgetsResponse,
} from "@/lib/widgets/staff-dashboard-widgets-types";
export { staffObserveKpiFromWidget } from "@/lib/widgets/to-staff-observe-kpi";
