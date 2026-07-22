import type { ReactNode } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { DashboardWidgetView } from "@/lib/widgets";
import {
  WidgetCard,
  widgetGoalPercentText,
  WidgetTargetLine,
} from "@/components/widgets/widget-card";
import { SingleStatWidget } from "@/components/widgets/single-stat-widget";

const SIZE = 96;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
}) {
  if (widget.target_value === null && !widget.target) {
    return <SingleStatWidget widget={widget}>{children}</SingleStatWidget>;
  }

  const pct = widget.progress_pct;
  const clamped = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const tone = widget.at_risk
    ? "danger"
    : pct !== null && pct >= 100
      ? "success"
      : "info";

  return (
    <WidgetCard
      widget={widget}
      className="staff-kpi-card-visual"
      footer={
        <>
          <div className="staff-widget-donut-wrap">
            <div className="staff-widget-donut">
              <svg
                width={SIZE}
                height={SIZE}
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="staff-widget-donut-svg"
                aria-hidden
              >
                <circle
                  className="staff-widget-donut-track"
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE}
                />
                <circle
                  className={`staff-widget-donut-arc is-${tone}`}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  strokeWidth={STROKE}
                  strokeDasharray={CIRCUMFERENCE}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />
              </svg>
              <div className="staff-widget-donut-center">
                <div className="staff-widget-donut-value">
                  {formatMetricValue(widget.current_value, widget.unit)}
                </div>
                <div className="staff-widget-donut-pct">
                  {pct !== null ? `${pct}%` : "—"}
                </div>
              </div>
            </div>
          </div>
          <div className="small text-body-secondary">{widgetGoalPercentText(widget)}</div>
          <WidgetTargetLine widget={widget} />
        </>
      }
    >
      {children}
    </WidgetCard>
  );
}
