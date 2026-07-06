import { NextResponse } from "next/server";
import {
  ClientApiHttpError,
  requestVaultPresignUpload,
} from "@/lib/client-orchestration-api";
import type { VaultPresignUploadRequest } from "@/lib/vault-upload-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VaultPresignUploadRequest;
    const presign = await requestVaultPresignUpload(body);
    return NextResponse.json(presign);
  } catch (error) {
    if (error instanceof ClientApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Vault presign upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
