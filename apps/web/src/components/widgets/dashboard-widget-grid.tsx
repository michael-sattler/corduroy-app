"use client";

import type { ReactNode } from "react";
import type { DashboardWidgetView } from "@/lib/widgets";
import { resolveWidgetRenderer } from "@/components/widgets/kinds-registry";

type DashboardWidgetGridProps = {
  widgets: DashboardWidgetView[];
  /** Extra classes on the flex wrap container. */
  className?: string;
  /** Rendered inside the card (e.g. staff observe control). */
  renderActions?: (widget: DashboardWidgetView) => ReactNode;
};

export function DashboardWidgetGrid({
  widgets,
  className,
  renderActions,
}: DashboardWidgetGridProps) {
  if (widgets.length === 0) return null;

  const gridClass = ["dashboard-widget-grid", className].filter(Boolean).join(" ");

  return (
    <div className={gridClass}>
      {widgets.map((widget) => {
        const { meta, Renderer } = resolveWidgetRenderer(widget.widget_type);

        return (
          <div key={widget.id} className="dashboard-widget-grid-item">
            <Renderer widget={widget} kind={meta}>
              {renderActions?.(widget)}
            </Renderer>
          </div>
        );
      })}
    </div>
  );
}
