import { NextResponse } from "next/server";
import {
  requestStaffVaultPresignDownload,
  type StaffVaultPresignDownloadRequest,
} from "@/lib/staff-orchestration-api";
import { StaffApiHttpError } from "@/lib/admin-api";
import { assertStaffCanAccessClient } from "@/lib/staff-client-access";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StaffVaultPresignDownloadRequest;

    if (!body.client_id?.trim()) {
      return NextResponse.json({ error: "client_id is required" }, { status: 400 });
    }

    if (!body.s3_key?.trim()) {
      return NextResponse.json({ error: "s3_key is required" }, { status: 400 });
    }

    await assertStaffCanAccessClient(body.client_id.trim());
    const presign = await requestStaffVaultPresignDownload(body);
    return NextResponse.json(presign);
  } catch (error) {
    if (error instanceof StaffApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Staff vault presign download failed";
    const status = message.includes("not assigned") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
