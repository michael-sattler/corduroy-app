import type { ReactNode } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { DashboardWidgetView } from "@/lib/widgets";
import {
  WidgetCard,
  widgetGoalPercentText,
  WidgetTargetLine,
} from "@/components/widgets/widget-card";

export function SingleStatWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
}) {
  return (
    <WidgetCard
      widget={widget}
      footer={
        <>
          <div className="staff-kpi-value">
            {formatMetricValue(widget.current_value, widget.unit)}
          </div>
          <div className="small text-body-secondary">
            {widgetGoalPercentText(widget)}
          </div>
          <WidgetTargetLine widget={widget} />
        </>
      }
    >
      {children}
    </WidgetCard>
  );
}
