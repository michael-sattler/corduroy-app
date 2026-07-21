import { StaffApiHttpError } from "@/lib/admin-api";
import {
  loadStaffMetricObservations,
  loadStaffMetricObservationsByClientMetricIds,
} from "@/lib/plan/load-staff-metric-observations";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const clientId = params.get("client_id")?.trim();
  const clientMetricId = params.get("client_metric_id")?.trim();
  const clientMetricIds = params
    .get("client_metric_ids")
    ?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }
  if (!clientMetricId && !clientMetricIds?.length) {
    return NextResponse.json(
      { error: "client_metric_id or client_metric_ids is required" },
      { status: 400 },
    );
  }

  try {
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    await supabase.auth.getUser();

    if (clientMetricIds?.length) {
      const { data: permittedMetrics, error: permittedMetricsError } =
        await supabase
          .from("client_metrics")
          .select("id")
          .eq("client_id", clientId)
          .in("id", clientMetricIds);

      if (permittedMetricsError) {
        throw new Error(
          `Client metric query failed: ${permittedMetricsError.message}`,
        );
      }

      const permittedIds = (permittedMetrics ?? []).map(
        (metric) => metric.id as string,
      );
      const observationsByMetricId =
        await loadStaffMetricObservationsByClientMetricIds(
          supabase,
          permittedIds,
        );

      return NextResponse.json({
        observations_by_client_metric_id: observationsByMetricId,
      });
    }

    const payload = await loadStaffMetricObservations(supabase, clientMetricId!);

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Observations query failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
