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
      "id, value, period_start, period_end, observed_on, change_source, source_document, recorded_at",
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
