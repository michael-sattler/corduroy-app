import "server-only";

import { readUserRole } from "@/lib/auth/roles";
import { getOrchestrationApiUrl } from "@/lib/admin-api";
import { createClient } from "@/lib/supabase/server";
import type {
  VaultPresignUploadRequest,
  VaultPresignUploadResponse,
} from "@/lib/vault-upload-types";

export class ClientApiHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ClientApiHttpError";
  }
}

export async function getClientAccessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new ClientApiHttpError(401, "Not authenticated");
  }

  if (readUserRole(user.app_metadata) !== "client") {
    throw new ClientApiHttpError(403, "Client access required");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new ClientApiHttpError(401, "Session expired — sign in again");
  }

  return session.access_token;
}

export async function requestVaultPresignUpload(
  body: VaultPresignUploadRequest,
): Promise<VaultPresignUploadResponse> {
  const token = await getClientAccessToken();
  const apiBase = getOrchestrationApiUrl();

  const res = await fetch(`${apiBase}/client/vault/presign-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });

  const payload = (await res.json().catch(() => ({}))) as
    | VaultPresignUploadResponse
    | { error?: string };

  if (!res.ok) {
    throw new ClientApiHttpError(
      res.status,
      "error" in payload && payload.error
        ? payload.error
        : `Presign upload failed (${res.status})`,
    );
  }

  return payload as VaultPresignUploadResponse;
}
