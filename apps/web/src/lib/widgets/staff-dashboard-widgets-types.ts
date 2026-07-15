export type StaffClientMetricOption = {
  id: string;
  label: string;
  metric_key: string;
  unit: string;
  default_widget_type: string;
  default_palette: string;
  is_active: boolean;
};

export type StaffDashboardWidgetEditorItem = {
  id: string;
  client_metric_id: string;
  metric_label: string;
  metric_key: string;
  unit: string;
  default_widget_type: string;
  default_palette: string;
  widget_type: string;
  palette: string;
  label_override: string | null;
  dimension_filter: Record<string, unknown>;
  sort_order: number;
  is_visible: boolean;
  current_value: number | null;
};

export type StaffDashboardWidgetsResponse = {
  widgets: StaffDashboardWidgetEditorItem[];
  client_metrics: StaffClientMetricOption[];
};

export type StaffDashboardWidgetCreateInput = {
  client_id: string;
  client_metric_id: string;
  widget_type?: string;
  palette?: string;
  label_override?: string | null;
  dimension_filter?: Record<string, unknown>;
  sort_order?: number;
  is_visible?: boolean;
};

export type StaffDashboardWidgetPatchInput = {
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
};
