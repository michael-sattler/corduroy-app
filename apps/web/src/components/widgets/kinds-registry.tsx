"use client";

import type { ComponentType, ReactNode } from "react";
import type { MetricWidgetType } from "@/lib/metric-catalog-types";
import {
  resolveWidgetKind,
  type DashboardWidgetView,
  type WidgetKindMeta,
} from "@/lib/widgets";
import { BarWidget } from "@/components/widgets/bar-widget";
import { DonutWidget } from "@/components/widgets/donut-widget";
import { ProgressToGoalWidget } from "@/components/widgets/progress-to-goal-widget";
import { SingleStatWidget } from "@/components/widgets/single-stat-widget";
import { TrafficLightWidget } from "@/components/widgets/traffic-light-widget";
import { TrendLineWidget } from "@/components/widgets/trend-line-widget";

export type WidgetRendererProps = {
  widget: DashboardWidgetView;
  kind: WidgetKindMeta;
  children?: ReactNode;
};

type KindEntry = {
  meta: WidgetKindMeta;
  Renderer: ComponentType<WidgetRendererProps>;
};

const RENDERERS: Record<MetricWidgetType, ComponentType<WidgetRendererProps>> = {
  single_stat: ({ widget, children }) => (
    <SingleStatWidget widget={widget}>{children}</SingleStatWidget>
  ),
  trend_line: ({ widget, children }) => (
    <TrendLineWidget widget={widget}>{children}</TrendLineWidget>
  ),
  bar: ({ widget, children }) => (
    <BarWidget widget={widget}>{children}</BarWidget>
  ),
  progress_to_goal: ({ widget, children }) => (
    <ProgressToGoalWidget widget={widget}>{children}</ProgressToGoalWidget>
  ),
  traffic_light: ({ widget, children }) => (
    <TrafficLightWidget widget={widget}>{children}</TrafficLightWidget>
  ),
  donut: ({ widget, children }) => (
    <DonutWidget widget={widget}>{children}</DonutWidget>
  ),
};

/** Look up renderer by stored widget_type; unknown kinds degrade to single_stat. */
export function resolveWidgetRenderer(
  widgetType: string | null | undefined,
): KindEntry {
  const meta = resolveWidgetKind(widgetType);
  return {
    meta,
    Renderer: RENDERERS[meta.id],
  };
}
