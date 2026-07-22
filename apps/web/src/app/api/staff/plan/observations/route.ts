import { StaffApiHttpError } from "@/lib/admin-api";
import {
  loadStaffMetricObservations,
  loadStaffMetricObservationsByClientMetricIds,
} from "@/lib/plan/load-staff-metric-observations";
import { requireStaffSession } from "@/lib/auth/session";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";
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

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    client_id?: string;
    observation_id?: string;
    action?: "ignore" | "restore";
    note?: string;
  };
  const clientId = body.client_id?.trim();
  const observationId = body.observation_id?.trim();
  if (!clientId || !observationId || !["ignore", "restore"].includes(body.action ?? "")) {
    return NextResponse.json(
      { error: "client_id, observation_id, and action are required" },
      { status: 400 },
    );
  }

  try {
    const { user } = await requireStaffSession();
    await assertStaffCanAccessClient(clientId);
    const admin = createServiceRoleClient();
    const { data: existing, error: existingError } = await admin
      .from("metric_observations")
      .select("client_metric_id")
      .eq("id", observationId)
      .maybeSingle();
    if (existingError) throw new Error(existingError.message);
    if (!existing) throw new Error("Observation not found");
    const { data: metric } = await admin
      .from("client_metrics")
      .select("id")
      .eq("id", existing.client_metric_id)
      .eq("client_id", clientId)
      .maybeSingle();
    if (!metric) throw new Error("Observation does not belong to this client");
    const now = new Date().toISOString();
    const patch =
      body.action === "ignore"
        ? {
            is_ignored: true,
            ignored_at: now,
            ignored_by: user.id,
            ignore_note: body.note?.trim() ?? "",
            restored_at: null,
            restored_by: null,
            restore_note: "",
          }
        : {
            is_ignored: false,
            restored_at: now,
            restored_by: user.id,
            restore_note: body.note?.trim() ?? "",
          };
    const { data, error } = await admin
      .from("metric_observations")
      .update(patch)
      .eq("id", observationId)
      .select("id, client_metric_id, is_ignored")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error("Observation not found");
    return NextResponse.json({ observation: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update observation";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not found") ? 404 : 500 },
    );
  }
}
