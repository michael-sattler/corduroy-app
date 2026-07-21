import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StaffPlanKpiEditorItem,
  StaffPlanKpiEditorResponse,
} from "@/lib/plan/staff-plan-kpi-editor-types";

type MetricDefinition = {
  label: string;
  unit: string;
};

type ClientMetric = {
  id: string;
  source_binding: string;
  current_value: number | null;
  current_value_observed_on: string | null;
  last_observed_at: string | null;
  is_active: boolean;
  metric_definitions: MetricDefinition | MetricDefinition[] | null;
};

type KpiRow = {
  kpi_id: string;
  baseline_snapshot: number | null;
  baseline_established: boolean;
  target: string;
  target_value: number | null;
  review_cadence: string;
  client_metrics: ClientMetric | ClientMetric[] | null;
};

function firstOrValue<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapKpi(row: KpiRow): StaffPlanKpiEditorItem {
  const metric = firstOrValue(row.client_metrics);
  const definition = metric ? firstOrValue(metric.metric_definitions) : null;

  return {
    kpi_id: row.kpi_id,
    client_metric_id: metric?.id ?? null,
    label: definition?.label ?? row.kpi_id,
    unit: definition?.unit ?? "ratio",
    source_binding: metric?.source_binding ?? "",
    current_value: metric?.current_value ?? null,
    current_value_observed_on: metric?.current_value_observed_on ?? null,
    last_observed_at: metric?.last_observed_at ?? null,
    is_active: metric?.is_active ?? false,
    baseline_snapshot: row.baseline_snapshot,
    baseline_established: row.baseline_established,
    target: row.target,
    target_value: row.target_value,
    review_cadence: row.review_cadence,
  };
}

export async function loadStaffPlanKpis(
  supabase: SupabaseClient,
  clientId: string,
): Promise<StaffPlanKpiEditorResponse> {
  const { data: planRow, error: planError } = await supabase
    .from("plans")
    .select("id, plan_id")
    .eq("client_id", clientId)
    .in("status", ["active", "in_review", "draft"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    throw new Error(`Plan query failed: ${planError.message}`);
  }

  if (!planRow) {
    return { plan_id: null, kpis: [] };
  }

  const plan = planRow as { id: string; plan_id: string };

  const { data: kpiRows, error: kpiError } = await supabase
    .from("plan_kpis")
    .select(
      `
      kpi_id,
      baseline_snapshot,
      baseline_established,
      target,
      target_value,
      review_cadence,
      client_metrics (
        id,
        source_binding,
        current_value,
        current_value_observed_on,
        last_observed_at,
        is_active,
        metric_definitions (
          label,
          unit
        )
      )
    `,
    )
    .eq("plan_id", plan.id)
    .order("kpi_id");

  if (kpiError) {
    throw new Error(`KPI query failed: ${kpiError.message}`);
  }

  return {
    plan_id: plan.plan_id,
    kpis: ((kpiRows ?? []) as KpiRow[]).map(mapKpi),
  };
}
