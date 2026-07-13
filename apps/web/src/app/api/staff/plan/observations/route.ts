import { StaffApiHttpError } from "@/lib/admin-api";
import { loadStaffMetricObservations } from "@/lib/plan/load-staff-metric-observations";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const clientId = params.get("client_id")?.trim();
  const clientMetricId = params.get("client_metric_id")?.trim();

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }
  if (!clientMetricId) {
    return NextResponse.json(
      { error: "client_metric_id is required" },
      { status: 400 },
    );
  }

  try {
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    await supabase.auth.getUser();
    const payload = await loadStaffMetricObservations(supabase, clientMetricId);

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
