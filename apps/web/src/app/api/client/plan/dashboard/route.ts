import { NextResponse } from "next/server";
import { loadClientPlanDashboard } from "@/lib/plan/load-client-plan-dashboard";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await loadClientPlanDashboard(supabase);
    return NextResponse.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Plan dashboard query failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
