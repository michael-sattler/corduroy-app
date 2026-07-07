import "server-only";

import {
  getOrchestrationApiUrl,
  getStaffAccessToken,
  StaffApiHttpError,
} from "@/lib/admin-api";
import type { VaultPresignDownloadRequest } from "@/lib/vault-download-types";
import type { VaultPresignDownloadResponse } from "@/lib/vault-download-types";
import type {
  VaultPresignUploadRequest,
  VaultPresignUploadResponse,
} from "@/lib/vault-upload-types";

export type StaffVaultPresignUploadRequest = VaultPresignUploadRequest & {
  client_id: string;
};

export type StaffVaultPresignDownloadRequest = VaultPresignDownloadRequest & {
  client_id: string;
};

export async function requestStaffVaultPresignUpload(
  body: StaffVaultPresignUploadRequest,
): Promise<VaultPresignUploadResponse> {
  const token = await getStaffAccessToken();
  const apiBase = getOrchestrationApiUrl();

  const res = await fetch(`${apiBase}/staff/vault/presign-upload`, {
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
    throw new StaffApiHttpError(
      res.status,
      "error" in payload && payload.error
        ? payload.error
        : `Staff presign upload failed (${res.status})`,
    );
  }

  return payload as VaultPresignUploadResponse;
}

export async function requestStaffVaultPresignDownload(
  body: StaffVaultPresignDownloadRequest,
): Promise<VaultPresignDownloadResponse> {
  const token = await getStaffAccessToken();
  const apiBase = getOrchestrationApiUrl();

  const res = await fetch(`${apiBase}/staff/vault/presign-download`, {
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
    | VaultPresignDownloadResponse
    | { error?: string };

  if (!res.ok) {
    throw new StaffApiHttpError(
      res.status,
      "error" in payload && payload.error
        ? payload.error
        : `Staff presign download failed (${res.status})`,
    );
  }

  return payload as VaultPresignDownloadResponse;
}
