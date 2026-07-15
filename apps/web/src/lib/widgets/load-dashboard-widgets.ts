import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { computeProgressPct } from "@/lib/plan/staff-plan-dashboard-format";
import { resolveWidgetKind } from "@/lib/widgets/resolve-kind";
import type {
  DashboardWidgetSeriesPoint,
  DashboardWidgetView,
} from "@/lib/widgets/types";

type MetricDefinition = {
  metric_key: string;
  label: string;
  unit: string;
  kind: string;
  stock_flow: string | null;
};

type ClientMetricRow = {
  id: string;
  client_id: string;
  current_value: number | null;
  current_value_observed_on: string | null;
  last_observed_at: string | null;
  source_binding: string;
  is_active: boolean;
  metric_definitions: MetricDefinition | MetricDefinition[] | null;
};

type WidgetRow = {
  id: string;
  client_metric_id: string;
  widget_type: string;
  palette: string;
  label_override: string | null;
  dimension_filter: Record<string, unknown> | null;
  sort_order: number;
  is_visible: boolean;
};

type PlanKpiRow = {
  kpi_id: string;
  client_metric_id: string;
  baseline_snapshot: number | null;
  baseline_established: boolean;
  target: string;
  target_value: number | null;
  review_cadence: string;
};

type ObservationRow = {
  client_metric_id: string;
  observed_on: string;
  value: number;
  dimension: Record<string, unknown> | null;
};

const SERIES_LIMIT = 48;

function firstOrValue<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function dimensionMatches(
  filter: Record<string, unknown>,
  dimension: Record<string, unknown> | null,
): boolean {
  const keys = Object.keys(filter);
  if (keys.length === 0) return true;
  if (!dimension) return false;
  return keys.every((key) => dimension[key] === filter[key]);
}

/**
 * Visible tiles for a client dashboard, ordered by sort_order.
 * Flatter two-step load (widgets → metrics) avoids nested-embed dropouts.
 */
export async function loadDashboardWidgets(
  supabase: SupabaseClient,
  clientId: string,
): Promise<DashboardWidgetView[]> {
  const { data: metricRows, error: metricError } = await supabase
    .from("client_metrics")
    .select(
      `
      id,
      client_id,
      current_value,
      current_value_observed_on,
      last_observed_at,
      source_binding,
      is_active,
      metric_definitions (
        metric_key,
        label,
        unit,
        kind,
        stock_flow
      )
    `,
    )
    .eq("client_id", clientId);

  if (metricError) {
    throw new Error(`Client metrics query failed: ${metricError.message}`);
  }

  const metrics = (metricRows ?? []) as ClientMetricRow[];
  const metricById = new Map(metrics.map((row) => [row.id, row]));
  const metricIds = metrics.map((row) => row.id);
  if (metricIds.length === 0) {
    return [];
  }

  const { data: widgetRows, error: widgetError } = await supabase
    .from("dashboard_widgets")
    .select(
      `
      id,
      client_metric_id,
      widget_type,
      palette,
      label_override,
      dimension_filter,
      sort_order,
      is_visible
    `,
    )
    .in("client_metric_id", metricIds)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (widgetError) {
    throw new Error(`Dashboard widgets query failed: ${widgetError.message}`);
  }

  const rows = ((widgetRows ?? []) as WidgetRow[]).slice().sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.id.localeCompare(b.id);
  });

  if (rows.length === 0) {
    return [];
  }

  const { data: planRow, error: planError } = await supabase
    .from("plans")
    .select("id")
    .eq("client_id", clientId)
    .in("status", ["active", "in_review", "draft"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    throw new Error(`Plan query failed: ${planError.message}`);
  }

  const planKpiByMetric = new Map<string, PlanKpiRow>();
  if (planRow?.id) {
    const { data: kpiRows, error: kpiError } = await supabase
      .from("plan_kpis")
      .select(
        `
        kpi_id,
        client_metric_id,
        baseline_snapshot,
        baseline_established,
        target,
        target_value,
        review_cadence
      `,
      )
      .eq("plan_id", planRow.id);

    if (kpiError) {
      throw new Error(`Plan KPIs query failed: ${kpiError.message}`);
    }

    for (const kpi of (kpiRows ?? []) as PlanKpiRow[]) {
      if (kpi.client_metric_id) {
        planKpiByMetric.set(kpi.client_metric_id, kpi);
      }
    }
  }

  const seriesMetricIds = new Set<string>();
  for (const row of rows) {
    if (resolveWidgetKind(row.widget_type).dataNeeds.includes("series")) {
      seriesMetricIds.add(row.client_metric_id);
    }
  }

  const seriesByMetric = new Map<string, ObservationRow[]>();
  if (seriesMetricIds.size > 0) {
    const { data: observations, error: obsError } = await supabase
      .from("metric_observations")
      .select("client_metric_id, observed_on, value, dimension")
      .in("client_metric_id", [...seriesMetricIds])
      .order("observed_on", { ascending: true })
      .limit(SERIES_LIMIT * seriesMetricIds.size);

    if (obsError) {
      throw new Error(`Observations query failed: ${obsError.message}`);
    }

    for (const obs of (observations ?? []) as ObservationRow[]) {
      const list = seriesByMetric.get(obs.client_metric_id) ?? [];
      list.push(obs);
      seriesByMetric.set(obs.client_metric_id, list);
    }
  }

  const views: DashboardWidgetView[] = [];

  for (const row of rows) {
    const metric = metricById.get(row.client_metric_id);
    const definition = metric ? firstOrValue(metric.metric_definitions) : null;
    if (!metric || !definition || !metric.is_active) {
      continue;
    }

    const planKpi = planKpiByMetric.get(row.client_metric_id) ?? null;
    const kindMeta = resolveWidgetKind(row.widget_type);
    let widgetType = kindMeta.id;

    if (kindMeta.dataNeeds.includes("plan_target") && !planKpi) {
      widgetType = "single_stat";
    }

    const current = metric.current_value;
    const progress = planKpi
      ? computeProgressPct(
          planKpi.baseline_snapshot,
          current,
          planKpi.target_value,
        )
      : null;
    const atRisk = Boolean(
      planKpi?.baseline_established &&
        progress !== null &&
        progress < 40 &&
        planKpi.target_value !== null,
    );

    const filter = row.dimension_filter ?? {};
    let series: DashboardWidgetSeriesPoint[] | undefined;
    if (resolveWidgetKind(widgetType).dataNeeds.includes("series")) {
      const raw = seriesByMetric.get(row.client_metric_id) ?? [];
      series = raw
        .filter((obs) => dimensionMatches(filter, obs.dimension))
        .slice(-SERIES_LIMIT)
        .map((obs) => ({
          observed_on: obs.observed_on,
          value: Number(obs.value),
        }));
    }

    views.push({
      id: row.id,
      client_metric_id: row.client_metric_id,
      widget_type: widgetType,
      palette: row.palette || "default",
      label: row.label_override?.trim() || definition.label,
      unit: definition.unit,
      current_value: current,
      current_value_observed_on: metric.current_value_observed_on,
      last_observed_at: metric.last_observed_at,
      target: planKpi?.target ?? null,
      target_value: planKpi?.target_value ?? null,
      baseline_established: planKpi?.baseline_established ?? false,
      progress_pct: progress,
      at_risk: atRisk,
      series,
      definition_kind: definition.kind,
      stock_flow: definition.stock_flow,
      review_cadence: planKpi?.review_cadence ?? "",
      source_binding: metric.source_binding ?? "",
      plan_kpi_id: planKpi?.kpi_id ?? null,
    });
  }

  return views;
}
