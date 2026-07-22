import type { ReactNode } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type { DashboardWidgetView } from "@/lib/widgets";
import { WidgetCard, WidgetTargetLine } from "@/components/widgets/widget-card";

const VB_W = 120;
const VB_H = 36;

const CADENCE_DAYS: Record<string, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
  quarterly: 90,
};

function dayNumber(date: string): number {
  return Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
}

function buildBarSlots(widget: DashboardWidgetView) {
  const start = widget.plan_period_start;
  const end = widget.plan_period_end;
  const cadenceDays = CADENCE_DAYS[widget.review_cadence ?? ""] ?? 30;
  if (!start || !end || widget.baseline_snapshot === null || widget.target_value === null) {
    return [];
  }

  const baseline = widget.baseline_snapshot;
  const target = widget.target_value;
  if (baseline === undefined || target === undefined) return [];
  const spanDays = Math.max(1, Math.floor((dayNumber(end) - dayNumber(start)) / 86_400_000));
  const count = Math.max(1, Math.floor(spanDays / cadenceDays));
  const increment = (target - baseline) / count;
  const actualBySlot = new Map<number, number>();

  for (const point of widget.series ?? []) {
    const offset = Math.floor((dayNumber(point.period_end) - dayNumber(start)) / 86_400_000);
    const index = Math.floor(offset / cadenceDays);
    if (index >= 0 && index < count) actualBySlot.set(index, point.value);
  }

  return Array.from({ length: count }, (_, index) => ({
    expected: baseline + increment * (index + 1),
    actual: actualBySlot.get(index) ?? null,
  }));
}

export function BarWidget({
  widget,
  children,
}: {
  widget: DashboardWidgetView;
  children?: ReactNode;
}) {
  const slots = buildBarSlots(widget);
  const barGap = 1.5;
  const barWidth =
    slots.length === 0
      ? 0
      : Math.max(2, (VB_W - barGap * (slots.length + 1)) / slots.length);
  const scaleValues = slots.flatMap((slot) =>
    slot.actual === null ? [slot.expected] : [slot.expected, slot.actual],
  );
  const min = Math.min(widget.baseline_snapshot ?? 0, widget.target_value ?? 0, ...scaleValues);
  const max = Math.max(widget.baseline_snapshot ?? 0, widget.target_value ?? 0, ...scaleValues);
  const range = max - min || 1;
  const heightFor = (value: number) =>
    Math.max(1.5, ((value - min) / range) * (VB_H - 2));

  return (
    <WidgetCard
      widget={widget}
      className="staff-kpi-card-visual"
      footer={
        <>
          <div className="staff-kpi-value">
            {formatMetricValue(widget.current_value, widget.unit)}
          </div>
          <div className="staff-widget-chart" aria-hidden={slots.length === 0}>
            {slots.length === 0 ? (
              <div className="small text-body-secondary">
                Set a baseline, numeric target, and plan period to chart progress.
              </div>
            ) : (
              <svg
                viewBox={`0 0 ${VB_W} ${VB_H}`}
                className="staff-widget-sparkline"
                preserveAspectRatio="none"
              >
                {slots.map((slot, index) => {
                  const x = barGap + index * (barWidth + barGap);
                  const expectedHeight = heightFor(slot.expected);
                  const actualHeight =
                    slot.actual === null ? null : heightFor(slot.actual);
                  return (
                    <g key={index}>
                      <rect
                        x={x}
                        y={VB_H - expectedHeight}
                        width={barWidth}
                        height={expectedHeight}
                        rx="0.8"
                        className="staff-widget-bar-expected"
                      />
                      {actualHeight !== null ? (
                        <rect
                          x={x + barWidth * 0.18}
                          y={VB_H - actualHeight}
                          width={barWidth * 0.64}
                          height={actualHeight}
                          rx="0.6"
                          className="staff-widget-bar"
                        />
                      ) : null}
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
          <div className="small text-body-secondary">
            {slots.length} planned {widget.review_cadence || "review"} period
            {slots.length === 1 ? "" : "s"}
          </div>
          <WidgetTargetLine widget={widget} />
        </>
      }
    >
      {children}
    </WidgetCard>
  );
}
