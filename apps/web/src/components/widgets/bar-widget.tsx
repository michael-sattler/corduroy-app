import type { ReactNode } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { DashboardWidgetView } from "@/lib/widgets";
import { WidgetCard } from "@/components/widgets/widget-card";
import { seriesToChartPoints } from "@/components/widgets/series-geometry";

const VB_W = 120;
const VB_H = 36;
const MAX_BARS = 12;

export function BarWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
}) {
  const series = (widget.series ?? []).slice(-MAX_BARS);
  const { points, min, max } = seriesToChartPoints(series, VB_W, VB_H, 1);
  const barGap = 1.5;
  const barWidth =
    points.length === 0
      ? 0
      : Math.max(2, (VB_W - barGap * (points.length + 1)) / points.length);

  return (
    <WidgetCard
      widget={widget}
      className="staff-kpi-card-visual"
      footer={
        <>
          <div className="staff-kpi-value">
            {formatMetricValue(widget.current_value, widget.unit)}
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
                {points.map((point, index) => {
                  const x = barGap + index * (barWidth + barGap);
                  const range = max - min || 1;
                  const h = Math.max(
                    1.5,
                    ((point.value - min) / range) * (VB_H - 2),
                  );
                  const y = VB_H - h;
                  return (
                    <rect
                      key={`${point.observed_on}-${index}`}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={h}
                      rx="0.8"
                      className="staff-widget-bar"
                    />
                  );
                })}
              </svg>
            )}
          </div>
          <div className="small text-body-secondary">
            {series.length > 0
              ? `Last ${series.length} period${series.length === 1 ? "" : "s"}`
              : "Bars await observations"}
          </div>
        </>
      }
    >
      {children}
    </WidgetCard>
  );
}
