import { StaffApiHttpError } from "@/lib/admin-api";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { loadVaultCatalog } from "@/lib/vault-catalog";
import { createClient } from "@/lib/supabase/server";
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
    const catalog = await loadVaultCatalog(supabase, clientId);

    return NextResponse.json(catalog);
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Staff vault catalog query failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
