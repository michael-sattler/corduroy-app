import { StaffApiHttpError } from "@/lib/admin-api";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loadStaffDashboardWidgets } from "@/lib/widgets/load-staff-dashboard-widgets";
import {
  createStaffDashboardWidget,
  deleteStaffDashboardWidget,
  swapStaffDashboardWidgetOrder,
  updateStaffDashboardWidget,
} from "@/lib/widgets/mutate-staff-dashboard-widgets";
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
    : message.includes("not found")
      ? 404
      : message.includes("must be one of")
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
    const payload = await loadStaffDashboardWidgets(supabase, clientId);
    return NextResponse.json(payload);
  } catch (error) {
    return handleError(error, "Dashboard widgets query failed");
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    client_id?: string;
    client_metric_id?: string;
    widget_type?: string;
    palette?: string;
    label_override?: string | null;
    dimension_filter?: Record<string, unknown>;
    sort_order?: number;
    is_visible?: boolean;
  };

  const clientId = body.client_id?.trim();
  const clientMetricId = body.client_metric_id?.trim();
  if (!clientId || !clientMetricId) {
    return badRequest("client_id and client_metric_id are required");
  }

  try {
    await assertStaffCanAccessClient(clientId);
    const admin = createServiceRoleClient();
    const widget = await createStaffDashboardWidget(admin, {
      client_id: clientId,
      client_metric_id: clientMetricId,
      widget_type: body.widget_type,
      palette: body.palette,
      label_override: body.label_override,
      dimension_filter: body.dimension_filter,
      sort_order: body.sort_order,
      is_visible: body.is_visible,
    });
    return NextResponse.json({ widget }, { status: 201 });
  } catch (error) {
    return handleError(error, "Could not create dashboard widget");
  }
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    client_id?: string;
    id?: string;
    direction?: "up" | "down";
    patch?: {
      widget_type?: string;
      palette?: string;
      label_override?: string | null;
      dimension_filter?: Record<string, unknown>;
      sort_order?: number;
      is_visible?: boolean;
    };
  };

  const clientId = body.client_id?.trim();
  const id = body.id?.trim();
  if (!clientId || !id) {
    return badRequest("client_id and id are required");
  }

  try {
    await assertStaffCanAccessClient(clientId);
    const admin = createServiceRoleClient();

    if (body.direction === "up" || body.direction === "down") {
      const widgets = await swapStaffDashboardWidgetOrder(admin, {
        client_id: clientId,
        id,
        direction: body.direction,
      });
      return NextResponse.json({ widgets });
    }

    const widget = await updateStaffDashboardWidget(admin, {
      client_id: clientId,
      id,
      patch: body.patch ?? {},
    });
    return NextResponse.json({ widget });
  } catch (error) {
    return handleError(error, "Could not update dashboard widget");
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    client_id?: string;
    id?: string;
  };

  const clientId = body.client_id?.trim();
  const id = body.id?.trim();
  if (!clientId || !id) {
    return badRequest("client_id and id are required");
  }

  try {
    await assertStaffCanAccessClient(clientId);
    const admin = createServiceRoleClient();
    await deleteStaffDashboardWidget(admin, { client_id: clientId, id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleError(error, "Could not delete dashboard widget");
  }
}
