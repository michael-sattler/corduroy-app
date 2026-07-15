import type { DashboardWidgetView } from "@/lib/widgets";

/** Quiet goal caption — incomplete progress uses the corner telltale instead. */
export function widgetGoalSubtext(widget: DashboardWidgetView): string | null {
  if (!widget.target) return null;

  if (widget.progress_pct !== null) {
    return `Target ${widget.target} · ${widget.progress_pct}% of goal`;
  }
  if (widget.current_value === null) {
    return `Target ${widget.target} · no reading yet`;
  }
  return `Target ${widget.target}`;
}
