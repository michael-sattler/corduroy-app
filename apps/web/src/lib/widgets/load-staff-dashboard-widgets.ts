import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StaffClientMetricOption,
  StaffDashboardWidgetEditorItem,
  StaffDashboardWidgetsResponse,
} from "@/lib/widgets/staff-dashboard-widgets-types";

type MetricDefinition = {
  metric_key: string;
  label: string;
  unit: string;
  widget_type: string;
  palette: string;
};

type ClientMetricRow = {
  id: string;
  is_active: boolean;
  current_value: number | null;
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
  client_metrics: ClientMetricRow | ClientMetricRow[] | null;
};

function firstOrValue<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapClientMetric(row: ClientMetricRow): StaffClientMetricOption | null {
  const definition = firstOrValue(row.metric_definitions);
  if (!definition) return null;

  return {
    id: row.id,
    label: definition.label,
    metric_key: definition.metric_key,
    unit: definition.unit,
    default_widget_type: definition.widget_type,
    default_palette: definition.palette,
    is_active: row.is_active,
  };
}

function mapWidget(row: WidgetRow): StaffDashboardWidgetEditorItem | null {
  const metric = firstOrValue(row.client_metrics);
  const definition = metric ? firstOrValue(metric.metric_definitions) : null;
  if (!metric || !definition) return null;

  return {
    id: row.id,
    client_metric_id: row.client_metric_id,
    metric_label: definition.label,
    metric_key: definition.metric_key,
    unit: definition.unit,
    default_widget_type: definition.widget_type,
    default_palette: definition.palette,
    widget_type: row.widget_type,
    palette: row.palette,
    label_override: row.label_override,
    dimension_filter: row.dimension_filter ?? {},
    sort_order: row.sort_order,
    is_visible: row.is_visible,
    current_value: metric.current_value,
  };
}

export async function loadStaffDashboardWidgets(
  supabase: SupabaseClient,
  clientId: string,
): Promise<StaffDashboardWidgetsResponse> {
  const { data: metricRows, error: metricError } = await supabase
    .from("client_metrics")
    .select(
      `
      id,
      is_active,
      current_value,
      metric_definitions (
        metric_key,
        label,
        unit,
        widget_type,
        palette
      )
    `,
    )
    .eq("client_id", clientId)
    .order("id");

  if (metricError) {
    throw new Error(`Client metrics query failed: ${metricError.message}`);
  }

  const clientMetrics = ((metricRows ?? []) as ClientMetricRow[])
    .map(mapClientMetric)
    .filter((row): row is StaffClientMetricOption => row !== null)
    .sort((a, b) => a.label.localeCompare(b.label));

  const metricIds = clientMetrics.map((m) => m.id);
  if (metricIds.length === 0) {
    return { widgets: [], client_metrics: [] };
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
      is_visible,
      client_metrics (
        id,
        is_active,
        current_value,
        metric_definitions (
          metric_key,
          label,
          unit,
          widget_type,
          palette
        )
      )
    `,
    )
    .in("client_metric_id", metricIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (widgetError) {
    throw new Error(`Dashboard widgets query failed: ${widgetError.message}`);
  }

  const widgets = ((widgetRows ?? []) as WidgetRow[])
    .map(mapWidget)
    .filter((row): row is StaffDashboardWidgetEditorItem => row !== null);

  return { widgets, client_metrics: clientMetrics };
}
