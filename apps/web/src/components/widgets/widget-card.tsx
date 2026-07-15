import type { ReactNode } from "react";
import type { DashboardWidgetView } from "@/lib/widgets";

const PROGRESS_INCOMPLETE_HINT =
  "Needs baseline, current value, and numeric target for progress";

/** Goal is implied when we have display/numeric target copy. */
export function widgetProgressIncomplete(widget: DashboardWidgetView): boolean {
  const hasGoal =
    widget.target_value !== null || Boolean(widget.target?.trim());
  return hasGoal && widget.progress_pct === null;
}

export function WidgetCard({
  widget,
  children,
  footer,
  className,
  /**
   * Corner telltale when progress can't run. Defaults from widget goal fields;
   * pass explicitly to force on/off.
   */
  progressIncomplete,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  progressIncomplete?: boolean;
}) {
  const showTelltale =
    progressIncomplete ?? widgetProgressIncomplete(widget);

  const classes = [
    "staff-kpi-card",
    widget.at_risk ? "at-risk" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes}>
      {children}
      <div
        className="small text-body-secondary text-truncate"
        title={widget.label}
      >
        {widget.label}
      </div>
      {footer}
      {showTelltale ? (
        <span
          className="staff-kpi-progress-telltale"
          title={PROGRESS_INCOMPLETE_HINT}
          aria-label={PROGRESS_INCOMPLETE_HINT}
          role="status"
        />
      ) : null}
    </div>
  );
}
