import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  StaffMetricObservation,
  StaffMetricObservationsResponse,
} from "@/lib/plan/staff-metric-observations-types";

/**
 * Most-recent observations for a single client metric, newest first.
 * RLS restricts rows to metrics the caller can access.
 */
export async function loadStaffMetricObservations(
  supabase: SupabaseClient,
  clientMetricId: string,
  limit = 10,
): Promise<StaffMetricObservationsResponse> {
  const { data, error } = await supabase
    .from("metric_observations")
    .select(
      "id, value, period_start, period_end, observed_on, change_source, source_document, recorded_at, is_ignored, ignored_at, ignore_note, restored_at, restore_note",
    )
    .eq("client_metric_id", clientMetricId)
    .order("period_end", { ascending: false })
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Observations query failed: ${error.message}`);
  }

  return { observations: (data ?? []) as StaffMetricObservation[] };
}

/** All observations for the requested client metrics, grouped newest first. */
export async function loadStaffMetricObservationsByClientMetricIds(
  supabase: SupabaseClient,
  clientMetricIds: string[],
): Promise<Record<string, StaffMetricObservation[]>> {
  const ids = [...new Set(clientMetricIds.filter(Boolean))];
  const grouped = Object.fromEntries(ids.map((id) => [id, []])) as Record<
    string,
    StaffMetricObservation[]
  >;

  if (ids.length === 0) return grouped;

  const { data, error } = await supabase
    .from("metric_observations")
    .select(
      "id, client_metric_id, value, period_start, period_end, observed_on, change_source, source_document, recorded_at, is_ignored, ignored_at, ignore_note, restored_at, restore_note",
    )
    .in("client_metric_id", ids)
    .order("period_end", { ascending: false })
    .order("recorded_at", { ascending: false });

  if (error) {
    throw new Error(`Observations query failed: ${error.message}`);
  }

  for (const row of (data ?? []) as (StaffMetricObservation & {
    client_metric_id: string;
  })[]) {
    grouped[row.client_metric_id]?.push(row);
  }

  return grouped;
}
