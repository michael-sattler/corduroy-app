import { StaffApiHttpError } from "@/lib/admin-api";
import { loadStaffPlanKpis } from "@/lib/plan/load-staff-plan-kpis";
import { updateStaffPlanKpi } from "@/lib/plan/mutate-staff-plan-kpi";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function handleError(error: unknown, fallback: string) {
  if (error instanceof StaffApiHttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  const message = error instanceof Error ? error.message : fallback;
  const status = message.includes("not assigned")
    ? 403
    : message.includes("not found") || message.includes("No active plan")
      ? 404
      : message.includes("must be")
        ? 400
        : 500;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  const clientId = new URL(request.url).searchParams.get("client_id")?.trim();

  if (!clientId) {
    return badRequest("client_id is required");
  }

  try {
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    await supabase.auth.getUser();
    const payload = await loadStaffPlanKpis(supabase, clientId);

    return NextResponse.json(payload);
  } catch (error) {
    return handleError(error, "Staff plan KPI query failed");
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    client_id?: string;
    kpi_id?: string;
    patch?: {
      baseline_snapshot?: number | null;
      baseline_established?: boolean;
      target?: string;
      target_value?: number | null;
      review_cadence?: string;
    };
  };

  const clientId = body.client_id?.trim();
  const kpiId = body.kpi_id?.trim();
  if (!clientId || !kpiId) {
    return badRequest("client_id and kpi_id are required");
  }

  try {
    await assertStaffCanAccessClient(clientId);
    const admin = createServiceRoleClient();
    const kpi = await updateStaffPlanKpi(admin, {
      client_id: clientId,
      kpi_id: kpiId,
      patch: body.patch ?? {},
    });
    return NextResponse.json({ kpi });
  } catch (error) {
    return handleError(error, "Could not update plan KPI");
  }
}
