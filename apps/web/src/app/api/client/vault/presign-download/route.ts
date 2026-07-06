import { NextResponse } from "next/server";
import {
  ClientApiHttpError,
  requestVaultPresignDownload,
} from "@/lib/client-orchestration-api";
import type { VaultPresignDownloadRequest } from "@/lib/vault-download-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VaultPresignDownloadRequest;

    if (!body.s3_key?.trim()) {
      return NextResponse.json({ error: "s3_key is required" }, { status: 400 });
    }

    const presign = await requestVaultPresignDownload(body);
    return NextResponse.json(presign);
  } catch (error) {
    if (error instanceof ClientApiHttpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const message =
      error instanceof Error ? error.message : "Vault presign download failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
