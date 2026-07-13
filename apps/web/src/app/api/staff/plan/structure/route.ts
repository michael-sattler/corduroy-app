import { StaffApiHttpError } from "@/lib/admin-api";
import { loadStaffPlanStructure } from "@/lib/plan/load-staff-plan-structure";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import {
  GOAL_PRIORITIES,
  INITIATIVE_OWNERS,
  INITIATIVE_STATUSES,
} from "@/lib/plan/staff-plan-structure-types";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const clientId = new URL(request.url).searchParams.get("client_id")?.trim();

  if (!clientId) {
    return NextResponse.json({ error: "client_id is required" }, { status: 400 });
  }

  try {
    await assertStaffCanAccessClient(clientId);

    const supabase = await createClient();
    await supabase.auth.getUser();
    const payload = await loadStaffPlanStructure(supabase, clientId);

    return NextResponse.json(payload);
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Staff plan structure query failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

type StructureUpdateBody = {
  client_id?: string;
  kind?: "initiative" | "goal";
  id?: string;
  patch?: Record<string, unknown>;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function requireText(value: unknown, field: string, allowEmpty = false): string {
  if (typeof value !== "string") {
    throw new StaffApiHttpError(400, `${field} must be a string`);
  }
  const trimmed = value.trim();
  if (!allowEmpty && trimmed.length === 0) {
    throw new StaffApiHttpError(400, `${field} is required`);
  }
  return trimmed;
}

function parseBudget(value: unknown): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num) || num < 0) {
    throw new StaffApiHttpError(400, "budget_usd must be a non-negative number");
  }
  return num;
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => ({}))) as StructureUpdateBody;
  const clientId = body.client_id?.trim();
  const kind = body.kind;
  const id = body.id?.trim();
  const patch = body.patch ?? {};

  if (!clientId || !id) {
    return badRequest("client_id and id are required");
  }

  if (kind !== "initiative" && kind !== "goal") {
    return badRequest("kind must be 'initiative' or 'goal'");
  }

  try {
    await assertStaffCanAccessClient(clientId);

    const admin = createServiceRoleClient();

    const { data: planRow, error: planError } = await admin
      .from("plans")
      .select("id")
      .eq("client_id", clientId)
      .in("status", ["active", "in_review", "draft"])
      .order("generated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 500 });
    }

    if (!planRow) {
      return NextResponse.json(
        { error: "No active plan for this client" },
        { status: 404 },
      );
    }

    const planId = (planRow as { id: string }).id;

    if (kind === "initiative") {
      const status = requireText(patch.status, "status");
      const owner = requireText(patch.owner, "owner");

      if (!INITIATIVE_STATUSES.includes(status as never)) {
        return badRequest(`Invalid status: ${status}`);
      }
      if (!INITIATIVE_OWNERS.includes(owner as never)) {
        return badRequest(`Invalid owner: ${owner}`);
      }

      const update = {
        label: requireText(patch.label, "label"),
        success_criteria: requireText(patch.success_criteria, "success_criteria", true),
        budget_usd: parseBudget(patch.budget_usd),
        status,
        owner,
      };

      const { data, error } = await admin
        .from("plan_initiatives")
        .update(update)
        .eq("plan_id", planId)
        .eq("initiative_id", id)
        .select("initiative_id, label, success_criteria, budget_usd, status, owner")
        .maybeSingle();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data) {
        return NextResponse.json({ error: "Initiative not found" }, { status: 404 });
      }

      return NextResponse.json({ initiative: data });
    }

    const priority = Number(patch.priority);
    if (!Number.isInteger(priority) || !GOAL_PRIORITIES.includes(priority as never)) {
      return badRequest(`Invalid priority: ${String(patch.priority)}`);
    }

    const update = {
      label: requireText(patch.label, "label"),
      description: requireText(patch.description, "description", true),
      target: requireText(patch.target, "target", true),
      priority,
    };

    const { data, error } = await admin
      .from("plan_goals")
      .update(update)
      .eq("plan_id", planId)
      .eq("goal_id", id)
      .select("goal_id, label, description, target, priority")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json({ goal: data });
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Staff plan structure update failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
