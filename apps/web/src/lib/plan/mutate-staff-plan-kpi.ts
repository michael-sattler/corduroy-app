import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { loadStaffPlanKpis } from "@/lib/plan/load-staff-plan-kpis";
import type { StaffPlanKpiEditorItem } from "@/lib/plan/staff-plan-kpi-editor-types";

const REVIEW_CADENCES = ["daily", "weekly", "monthly", "quarterly"] as const;

export type StaffPlanKpiPatch = {
  baseline_snapshot?: number | null;
  baseline_established?: boolean;
  target?: string;
  target_value?: number | null;
  review_cadence?: string;
};

function parseOptionalNumber(
  value: unknown,
  field: string,
): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) {
    throw new Error(`${field} must be a number`);
  }
  return num;
}

export async function updateStaffPlanKpi(
  admin: SupabaseClient,
  input: {
    client_id: string;
    kpi_id: string;
    patch: StaffPlanKpiPatch;
  },
): Promise<StaffPlanKpiEditorItem> {
  const { data: planRow, error: planError } = await admin
    .from("plans")
    .select("id")
    .eq("client_id", input.client_id)
    .in("status", ["active", "in_review", "draft"])
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (planError) {
    throw new Error(`Plan query failed: ${planError.message}`);
  }
  if (!planRow) {
    throw new Error("No active plan for this client");
  }

  const planId = (planRow as { id: string }).id;
  const updates: Record<string, unknown> = {};

  if (input.patch.baseline_snapshot !== undefined) {
    updates.baseline_snapshot = parseOptionalNumber(
      input.patch.baseline_snapshot,
      "baseline_snapshot",
    );
  }
  if (input.patch.baseline_established !== undefined) {
    updates.baseline_established = Boolean(input.patch.baseline_established);
  }
  if (input.patch.target !== undefined) {
    if (typeof input.patch.target !== "string") {
      throw new Error("target must be a string");
    }
    updates.target = input.patch.target.trim();
  }
  if (input.patch.target_value !== undefined) {
    updates.target_value = parseOptionalNumber(
      input.patch.target_value,
      "target_value",
    );
  }
  if (input.patch.review_cadence !== undefined) {
    const cadence = input.patch.review_cadence.trim();
    if (!REVIEW_CADENCES.includes(cadence as (typeof REVIEW_CADENCES)[number])) {
      throw new Error(
        `review_cadence must be one of: ${REVIEW_CADENCES.join(", ")}`,
      );
    }
    updates.review_cadence = cadence;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No fields to update");
  }

  // Establishing a baseline implies the flag is true when a snapshot is set.
  if (
    updates.baseline_snapshot !== undefined &&
    updates.baseline_snapshot !== null &&
    input.patch.baseline_established === undefined
  ) {
    updates.baseline_established = true;
  }
  if (updates.baseline_snapshot === null && input.patch.baseline_established === undefined) {
    updates.baseline_established = false;
  }

  const { error } = await admin
    .from("plan_kpis")
    .update(updates)
    .eq("plan_id", planId)
    .eq("kpi_id", input.kpi_id);

  if (error) {
    throw new Error(`Could not update plan KPI: ${error.message}`);
  }

  const loaded = await loadStaffPlanKpis(admin, input.client_id);
  const kpi = loaded.kpis.find((row) => row.kpi_id === input.kpi_id);
  if (!kpi) {
    throw new Error("KPI not found after save");
  }
  return kpi;
}
