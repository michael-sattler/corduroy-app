import type { ReactNode } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { DashboardWidgetView } from "@/lib/widgets";
import { WidgetCard } from "@/components/widgets/widget-card";
import {
  polylinePath,
  seriesToChartPoints,
} from "@/components/widgets/series-geometry";

const VB_W = 120;
const VB_H = 36;

export function TrendLineWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
}) {
  const series = widget.series ?? [];
  const { points } = seriesToChartPoints(series, VB_W, VB_H);
  const path = polylinePath(points);
  const first = series[0];
  const last = series[series.length - 1];

  return (
    <WidgetCard
      widget={widget}
      className="staff-kpi-card-visual"
      footer={
        <>
          <div className="d-flex align-items-baseline justify-content-between gap-2">
            <div className="staff-kpi-value">
              {formatMetricValue(widget.current_value, widget.unit)}
            </div>
            {series.length >= 2 && first && last ? (
              <div
                className={`small fw-semibold staff-widget-delta${
                  last.value >= first.value ? " is-up" : " is-down"
                }`}
              >
                {last.value >= first.value ? "↑" : "↓"}{" "}
                {formatMetricValue(Math.abs(last.value - first.value), widget.unit)}
              </div>
            ) : null}
          </div>
          <div className="staff-widget-chart" aria-hidden={series.length === 0}>
            {series.length === 0 ? (
              <div className="small text-body-secondary">No history yet</div>
            ) : (
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="staff-widget-sparkline"
                preserveAspectRatio="none"
              >
                <path d={path} className="staff-widget-sparkline-line" />
                {points.length > 0 ? (
                  <circle
                    cx={points[points.length - 1].x}
                    cy={points[points.length - 1].y}
                    r="2.2"
                    className="staff-widget-sparkline-dot"
                  />
                ) : null}
              </svg>
            )}
          </div>
          <div className="small text-body-secondary">
            {series.length > 0
              ? `${series.length} reading${series.length === 1 ? "" : "s"}`
              : "Trend awaits observations"}
            {widget.current_value_observed_on
              ? ` · as of ${widget.current_value_observed_on}`
              : ""}
          </div>
        </>
      }
    >
      {children}
    </WidgetCard>
  );
}
