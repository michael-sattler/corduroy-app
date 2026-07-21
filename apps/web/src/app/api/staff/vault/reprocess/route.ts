import { NextResponse } from "next/server";
import { StaffApiHttpError } from "@/lib/admin-api";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";
import { requestStaffVaultReprocess } from "@/lib/staff-orchestration-api";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      client_id?: unknown;
      vault_object_id?: unknown;
    };
    const clientId = typeof body.client_id === "string" ? body.client_id.trim() : "";
    const objectId =
      typeof body.vault_object_id === "string" ? body.vault_object_id.trim() : "";
    if (!clientId || !objectId) {
      return NextResponse.json(
        { error: "client_id and vault_object_id are required" },
        { status: 400 },
      );
    }
    await assertStaffCanAccessClient(clientId);
    await requestStaffVaultReprocess({ client_id: clientId, vault_object_id: objectId });
    return NextResponse.json({ queued: true });
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Vault reprocess failed";
    return NextResponse.json(
      { error: message },
      { status: message.includes("not assigned") ? 403 : 500 },
    );
  }
}
