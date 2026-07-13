// Shared metric-catalog vocabulary. Values MUST stay in sync with the
// public.metric_definitions CHECK constraints (migration 20260710120000).

export const METRIC_TIERS = ["core", "swap", "bespoke"] as const;
export const METRIC_KINDS = ["observed", "derived", "ratio"] as const;
export const METRIC_STOCK_FLOWS = ["stock", "flow"] as const;
// Suggested catalog domains. Free-text in the DB, so the UI offers these as a
// datalist rather than a hard enum.
export const METRIC_CATEGORY_SUGGESTIONS = [
  "Financial",
  "Membership",
  "Customers",
  "People",
  "B2B Pipeline",
] as const;
export const METRIC_FAMILIES = [
  "profitability",
  "liquidity",
  "retention",
  "acquisition",
  "productivity",
] as const;
export const METRIC_UNITS = [
  "currency",
  "percent",
  "count",
  "days",
  "ratio",
  "months",
] as const;
export const METRIC_WIDGET_TYPES = [
  "single_stat",
  "trend_line",
  "bar",
  "progress_to_goal",
  "traffic_light",
] as const;
export const METRIC_UPDATE_INTERVALS = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
] as const;

export type MetricTier = (typeof METRIC_TIERS)[number];
export type MetricKind = (typeof METRIC_KINDS)[number];
export type MetricStockFlow = (typeof METRIC_STOCK_FLOWS)[number];
export type MetricFamily = (typeof METRIC_FAMILIES)[number];
export type MetricUnit = (typeof METRIC_UNITS)[number];
export type MetricWidgetType = (typeof METRIC_WIDGET_TYPES)[number];
export type MetricUpdateInterval = (typeof METRIC_UPDATE_INTERVALS)[number];

export type MetricDefinitionRecord = {
  id: string;
  client_id: string | null;
  client_name: string | null;
  metric_key: string;
  label: string;
  family: string | null;
  category: string | null;
  stock_flow: string | null;
  description: string;
  formula_expression: string | null;
  tier: string;
  kind: string;
  unit: string;
  widget_type: string;
  palette: string;
  update_interval: string;
  applicable_ccps: number[];
  benchmarkable: boolean;
  needs_review: boolean;
  created_at: string;
};

export type MetricClientOption = {
  id: string;
  name: string;
};

export type MetricDefinitionInput = {
  client_id: string | null;
  metric_key: string;
  label: string;
  family: string | null;
  category: string | null;
  stock_flow: string | null;
  description: string;
  formula_expression: string | null;
  tier: string;
  kind: string;
  unit: string;
  widget_type: string;
  update_interval: string;
  applicable_ccps: number[];
  benchmarkable: boolean;
  needs_review: boolean;
};

const TITLE_OVERRIDES: Record<string, string> = {
  progress_to_goal: "Progress to goal",
  traffic_light: "Traffic light",
  trend_line: "Trend line",
  single_stat: "Single stat",
};

export function humanizeMetricValue(value: string): string {
  return (
    TITLE_OVERRIDES[value] ??
    value
      .split("_")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
}

/** Bootstrap text-bg-* class for a pill, keyed by facet + value. */
export function metricPillClass(
  facet: "tier" | "kind" | "family",
  value: string,
): string {
  if (facet === "tier") {
    if (value === "core") return "text-bg-primary";
    if (value === "swap") return "text-bg-info";
    return "text-bg-secondary";
  }
  if (facet === "kind") {
    if (value === "observed") return "text-bg-success";
    if (value === "derived") return "text-bg-info";
    return "text-bg-warning"; // ratio
  }
  // family
  switch (value) {
    case "profitability":
      return "text-bg-success";
    case "liquidity":
      return "text-bg-info";
    case "retention":
      return "text-bg-primary";
    case "acquisition":
      return "text-bg-warning";
    case "productivity":
      return "text-bg-dark";
    default:
      return "text-bg-secondary";
  }
}

export function parseApplicableCcps(raw: string): number[] {
  return raw
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((n) => Number.isInteger(n));
}
