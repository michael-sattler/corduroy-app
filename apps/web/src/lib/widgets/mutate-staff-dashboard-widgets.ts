import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { METRIC_WIDGET_TYPES } from "@/lib/metric-catalog-types";
import type { StaffDashboardWidgetEditorItem } from "@/lib/widgets/staff-dashboard-widgets-types";
import { loadStaffDashboardWidgets } from "@/lib/widgets/load-staff-dashboard-widgets";

const KNOWN_TYPES = new Set<string>(METRIC_WIDGET_TYPES);

function assertWidgetType(value: string): string {
  if (!KNOWN_TYPES.has(value)) {
    throw new Error(
      `widget_type must be one of: ${METRIC_WIDGET_TYPES.join(", ")}`,
    );
  }
  return value;
}

async function requireClientMetricForClient(
  admin: SupabaseClient,
  clientId: string,
  clientMetricId: string,
): Promise<{
  widget_type: string;
  palette: string;
}> {
  const { data, error } = await admin
    .from("client_metrics")
    .select(
      `
      id,
      client_id,
      metric_definitions (
        widget_type,
        palette
      )
    `,
    )
    .eq("id", clientMetricId)
    .maybeSingle();

  if (error) {
    throw new Error(`Client metric lookup failed: ${error.message}`);
  }
  if (!data || data.client_id !== clientId) {
    throw new Error("Client metric not found for this client");
  }

  const definition = Array.isArray(data.metric_definitions)
    ? data.metric_definitions[0]
    : data.metric_definitions;

  return {
    widget_type: definition?.widget_type ?? "single_stat",
    palette: definition?.palette ?? "default",
  };
}

async function reloadWidget(
  admin: SupabaseClient,
  clientId: string,
  widgetId: string,
): Promise<StaffDashboardWidgetEditorItem> {
  const { widgets } = await loadStaffDashboardWidgets(admin, clientId);
  const widget = widgets.find((row) => row.id === widgetId);
  if (!widget) {
    throw new Error("Widget not found after save");
  }
  return widget;
}

export async function createStaffDashboardWidget(
  admin: SupabaseClient,
  input: {
    client_id: string;
    client_metric_id: string;
    widget_type?: string;
    palette?: string;
    label_override?: string | null;
    dimension_filter?: Record<string, unknown>;
    sort_order?: number;
    is_visible?: boolean;
  },
): Promise<StaffDashboardWidgetEditorItem> {
  const defaults = await requireClientMetricForClient(
    admin,
    input.client_id,
    input.client_metric_id,
  );

  const widgetType = assertWidgetType(input.widget_type ?? defaults.widget_type);

  let sortOrder = input.sort_order;
  if (sortOrder === undefined) {
    const loaded = await loadStaffDashboardWidgets(admin, input.client_id);
    const max = loaded.widgets.reduce(
      (acc, row) => Math.max(acc, row.sort_order),
      -1,
    );
    sortOrder = max + 1;
  }

  const { data, error } = await admin
    .from("dashboard_widgets")
    .insert({
      client_metric_id: input.client_metric_id,
      widget_type: widgetType,
      palette: input.palette?.trim() || defaults.palette,
      label_override: input.label_override?.trim() || null,
      dimension_filter: input.dimension_filter ?? {},
      sort_order: sortOrder,
      is_visible: input.is_visible ?? true,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Could not create dashboard widget: ${error.message}`);
  }

  return reloadWidget(admin, input.client_id, data.id as string);
}

export async function updateStaffDashboardWidget(
  admin: SupabaseClient,
  input: {
    client_id: string;
    id: string;
    patch: {
      widget_type?: string;
      palette?: string;
      label_override?: string | null;
      dimension_filter?: Record<string, unknown>;
      sort_order?: number;
      is_visible?: boolean;
    };
  },
): Promise<StaffDashboardWidgetEditorItem> {
  const { widgets } = await loadStaffDashboardWidgets(admin, input.client_id);
  const existing = widgets.find((row) => row.id === input.id);
  if (!existing) {
    throw new Error("Widget not found for this client");
  }

  const updates: Record<string, unknown> = {};
  if (input.patch.widget_type !== undefined) {
    updates.widget_type = assertWidgetType(input.patch.widget_type);
  }
  if (input.patch.palette !== undefined) {
    updates.palette = input.patch.palette.trim() || "default";
  }
  if (input.patch.label_override !== undefined) {
    const trimmed = input.patch.label_override?.trim() ?? "";
    updates.label_override = trimmed.length > 0 ? trimmed : null;
  }
  if (input.patch.dimension_filter !== undefined) {
    updates.dimension_filter = input.patch.dimension_filter;
  }
  if (input.patch.sort_order !== undefined) {
    updates.sort_order = input.patch.sort_order;
  }
  if (input.patch.is_visible !== undefined) {
    updates.is_visible = input.patch.is_visible;
  }

  if (Object.keys(updates).length === 0) {
    return existing;
  }

  const { error } = await admin
    .from("dashboard_widgets")
    .update(updates)
    .eq("id", input.id);

  if (error) {
    throw new Error(`Could not update dashboard widget: ${error.message}`);
  }

  return reloadWidget(admin, input.client_id, input.id);
}

export async function deleteStaffDashboardWidget(
  admin: SupabaseClient,
  input: { client_id: string; id: string },
): Promise<void> {
  const { widgets } = await loadStaffDashboardWidgets(admin, input.client_id);
  const existing = widgets.find((row) => row.id === input.id);
  if (!existing) {
    throw new Error("Widget not found for this client");
  }

  const { error } = await admin
    .from("dashboard_widgets")
    .delete()
    .eq("id", input.id);

  if (error) {
    throw new Error(`Could not delete dashboard widget: ${error.message}`);
  }
}

export async function swapStaffDashboardWidgetOrder(
  admin: SupabaseClient,
  input: { client_id: string; id: string; direction: "up" | "down" },
): Promise<StaffDashboardWidgetEditorItem[]> {
  const { widgets } = await loadStaffDashboardWidgets(admin, input.client_id);
  const index = widgets.findIndex((row) => row.id === input.id);
  if (index < 0) {
    throw new Error("Widget not found for this client");
  }

  const swapWith = input.direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= widgets.length) {
    return widgets;
  }

  const a = widgets[index];
  const b = widgets[swapWith];
  const aOrder = a.sort_order;
  const bOrder = b.sort_order;

  // If orders are equal, assign contiguous ranks from current list order.
  const nextA = aOrder === bOrder ? swapWith : bOrder;
  const nextB = aOrder === bOrder ? index : aOrder;

  const { error: errorA } = await admin
    .from("dashboard_widgets")
    .update({ sort_order: nextA })
    .eq("id", a.id);
  if (errorA) {
    throw new Error(`Could not reorder widget: ${errorA.message}`);
  }

  const { error: errorB } = await admin
    .from("dashboard_widgets")
    .update({ sort_order: nextB })
    .eq("id", b.id);
  if (errorB) {
    throw new Error(`Could not reorder widget: ${errorB.message}`);
  }

  const reloaded = await loadStaffDashboardWidgets(admin, input.client_id);
  return reloaded.widgets;
}
