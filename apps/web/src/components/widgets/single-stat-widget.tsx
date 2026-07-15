import type { ReactNode } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { DashboardWidgetView } from "@/lib/widgets";
import { WidgetCard } from "@/components/widgets/widget-card";
import { widgetGoalSubtext } from "@/components/widgets/widget-subtext";

export function SingleStatWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
}) {
  const subtext = widgetGoalSubtext(widget);

  return (
    <WidgetCard
      widget={widget}
      footer={
        <>
          <div className="staff-kpi-value">
            {formatMetricValue(widget.current_value, widget.unit)}
          </div>
          {subtext ? (
            <div className="small text-body-secondary">{subtext}</div>
          ) : null}
        </>
      }
    >
      {children}
    </WidgetCard>
  );
}
