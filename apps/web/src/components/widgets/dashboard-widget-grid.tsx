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
  /** Activated when staff selects a widget tile. */
  onSelectWidget?: (widget: DashboardWidgetView) => void;
};

export function DashboardWidgetGrid({
  widgets,
  className,
  renderActions,
  onSelectWidget,
}: DashboardWidgetGridProps) {
  if (widgets.length === 0) return null;

  const gridClass = ["dashboard-widget-grid", className].filter(Boolean).join(" ");

  return (
    <div className={gridClass}>
      {widgets.map((widget) => {
        const { meta, Renderer } = resolveWidgetRenderer(widget.widget_type);

        return (
          <div
            key={widget.id}
            className={`dashboard-widget-grid-item${
              onSelectWidget ? " is-interactive" : ""
            }`}
            role={onSelectWidget ? "button" : undefined}
            tabIndex={onSelectWidget ? 0 : undefined}
            onClick={() => onSelectWidget?.(widget)}
            onKeyDown={(event) => {
              if (
                onSelectWidget &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                onSelectWidget(widget);
              }
            }}
            aria-label={
              onSelectWidget ? `Manage ${widget.label} dashboard metric` : undefined
            }
          >
            <Renderer widget={widget} kind={meta}>
              {renderActions?.(widget)}
            </Renderer>
          </div>
        );
      })}
    </div>
  );
}
