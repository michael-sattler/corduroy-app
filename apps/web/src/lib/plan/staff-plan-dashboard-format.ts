export function formatMetricValue(
  value: number | null | undefined,
  unit: string,
): string {
  if (value === null || value === undefined) return "—";

  switch (unit) {
    case "currency":
      return value >= 1000
        ? `$${Math.round(value).toLocaleString("en-US")}`
        : `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    case "percent":
      return `${value.toLocaleString("en-US", { maximumFractionDigits: 1 })}%`;
    case "count":
      return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
    case "days":
      return `${value}d`;
    case "months":
      return `${value} mo`;
    default:
      return value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }
}

export function formatPlanPeriod(start: string, end: string): string {
  const s = new Date(`${start}T12:00:00`);
  const e = new Date(`${end}T12:00:00`);
  const sameYear = s.getFullYear() === e.getFullYear();
  const startFmt = s.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endFmt = e.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startFmt} – ${endFmt}`;
}

export function computeProgressPct(
  baseline: number | null,
  current: number | null,
  target: number | null,
): number | null {
  if (
    baseline === null ||
    current === null ||
    target === null ||
    target === baseline
  ) {
    return null;
  }

  const pct = ((current - baseline) / (target - baseline)) * 100;
  if (!Number.isFinite(pct)) return null;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function initiativeStatusTone(
  status: string,
): "success" | "warning" | "danger" {
  if (status === "done") return "success";
  if (status === "in_progress") return "warning";
  if (status === "blocked") return "danger";
  return "warning";
}

export function taskStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}
