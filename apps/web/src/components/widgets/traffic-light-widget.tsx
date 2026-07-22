import type { ReactNode } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { DashboardWidgetView } from "@/lib/widgets";
import {
  WidgetCard,
  widgetGoalPercentText,
  WidgetTargetLine,
} from "@/components/widgets/widget-card";

export type TrafficTone = "green" | "yellow" | "red" | "unknown";

/** Shared threshold rules for traffic-light tiles. */
export function trafficToneForWidget(widget: DashboardWidgetView): TrafficTone {
  if (widget.current_value === null) return "unknown";

  if (widget.progress_pct !== null) {
    if (widget.progress_pct < 40 || widget.at_risk) return "red";
    if (widget.progress_pct < 70) return "yellow";
    return "green";
  }

  if (widget.target_value !== null) {
    const target = widget.target_value;
    if (target === 0) {
      return widget.current_value === 0 ? "green" : "yellow";
    }
    const ratio = widget.current_value / target;
    if (ratio < 0.4) return "red";
    if (ratio < 0.7) return "yellow";
    return "green";
  }

  return "unknown";
}

function toneLabel(tone: TrafficTone): string {
  switch (tone) {
    case "green":
      return "On track";
    case "yellow":
      return "Watch";
    case "red":
      return "At risk";
    default:
      return "No signal";
  }
}

export function TrafficLightWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
}) {
  const tone = trafficToneForWidget(widget);

  return (
    <WidgetCard
      widget={widget}
      className={`staff-kpi-card-visual staff-kpi-card-traffic is-${tone}`}
      footer={
        <>
          <div className="d-flex align-items-center justify-content-between gap-2 mt-1">
            <div className="staff-kpi-value mb-0">
              {formatMetricValue(widget.current_value, widget.unit)}
            </div>
            <div
              className={`staff-widget-traffic-lights is-${tone}`}
              aria-label={toneLabel(tone)}
            >
              <span className="staff-widget-traffic-lamp is-red" />
              <span className="staff-widget-traffic-lamp is-yellow" />
              <span className="staff-widget-traffic-lamp is-green" />
            </div>
          </div>
          <div className="small text-body-secondary mt-1">
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
