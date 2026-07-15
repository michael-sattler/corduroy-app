"use client";

import { DashboardWidgetGrid } from "@/components/widgets/dashboard-widget-grid";
import type { DashboardWidgetView } from "@/lib/widgets";

/** Client (and shared) key-metrics grid backed by dashboard_widgets. */
export function PlanKpiWidgets({
  widgets,
}: {
  widgets: DashboardWidgetView[];
}) {
  if (widgets.length === 0) return null;

  return <DashboardWidgetGrid widgets={widgets} />;
}
