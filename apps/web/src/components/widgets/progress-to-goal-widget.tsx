import type { ReactNode } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { DashboardWidgetView } from "@/lib/widgets";
import { WidgetCard } from "@/components/widgets/widget-card";
import { SingleStatWidget } from "@/components/widgets/single-stat-widget";

export function ProgressToGoalWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
}) {
  // Loader already swaps unbound progress tiles to single_stat; belt-and-suspenders.
  if (widget.target_value === null && !widget.target) {
    return <SingleStatWidget widget={widget}>{children}</SingleStatWidget>;
  }

  const pct = widget.progress_pct;
  const barWidth = pct === null ? 0 : Math.max(0, Math.min(100, pct));
  const tone = widget.at_risk
    ? "danger"
    : pct !== null && pct >= 100
      ? "success"
      : "info";

  const subtext =
    pct !== null
      ? `${pct}% of goal${widget.target ? ` · Target ${widget.target}` : ""}`
      : widget.target
        ? `Target ${widget.target}`
        : null;

  return (
    <WidgetCard
      widget={widget}
      className="staff-kpi-card-visual"
      footer={
        <>
          <div className="staff-kpi-value">
            {formatMetricValue(widget.current_value, widget.unit)}
          </div>
          <div className="progress staff-widget-progress-bar mt-2 mb-1">
            <div
              className={`progress-bar staff-widget-progress-fill is-${tone}`}
              style={{ width: `${barWidth}%` }}
              role="progressbar"
              aria-valuenow={barWidth}
              aria-valuemin={0}
              aria-valuemax={100}
            />
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
