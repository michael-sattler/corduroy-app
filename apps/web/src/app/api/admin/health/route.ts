import { NextResponse } from "next/server";
import {
  getStaffAccessToken,
  requireStaffApiAccess,
  StaffApiHttpError,
} from "@/lib/admin-api";
import { runAdminHealthChecks } from "@/lib/admin-health-checks";
import { requirePublicSupabaseConfig } from "@/lib/supabase/env";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireStaffApiAccess();
    const token = await getStaffAccessToken();
    const { url, anonKey } = requirePublicSupabaseConfig();
    const checks = await runAdminHealthChecks(token, url, anonKey);
    return NextResponse.json({ checks });
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Health check unavailable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
