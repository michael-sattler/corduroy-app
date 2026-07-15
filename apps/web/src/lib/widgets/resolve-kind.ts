import {
  METRIC_WIDGET_TYPES,
  type MetricWidgetType,
} from "@/lib/metric-catalog-types";
import type { WidgetDataNeeds } from "@/lib/widgets/types";

export type WidgetKindMeta = {
  id: MetricWidgetType;
  label: string;
  dataNeeds: WidgetDataNeeds[];
};

const KIND_META: Record<MetricWidgetType, WidgetKindMeta> = {
  single_stat: {
    id: "single_stat",
    label: "Single stat",
    dataNeeds: ["current"],
  },
  trend_line: {
    id: "trend_line",
    label: "Trend line",
    dataNeeds: ["current", "series"],
  },
  bar: {
    id: "bar",
    label: "Bar",
    dataNeeds: ["current", "series"],
  },
  progress_to_goal: {
    id: "progress_to_goal",
    label: "Progress to goal",
    dataNeeds: ["current", "plan_target"],
  },
  traffic_light: {
    id: "traffic_light",
    label: "Traffic light",
    dataNeeds: ["current", "plan_target"],
  },
  donut: {
    id: "donut",
    label: "Donut",
    dataNeeds: ["current", "plan_target"],
  },
};

const KNOWN = new Set<string>(METRIC_WIDGET_TYPES);

/** Resolve a stored widget_type; unknown values degrade to single_stat. */
export function resolveWidgetKind(
  widgetType: string | null | undefined,
): WidgetKindMeta {
  if (widgetType && KNOWN.has(widgetType)) {
    return KIND_META[widgetType as MetricWidgetType];
  }
  return KIND_META.single_stat;
}

export function listWidgetKinds(): WidgetKindMeta[] {
  return METRIC_WIDGET_TYPES.map((id) => KIND_META[id]);
}
