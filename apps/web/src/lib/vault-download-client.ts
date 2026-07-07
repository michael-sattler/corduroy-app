import type {
  VaultPresignDownloadResponse,
  VaultDownloadResult,
} from "@/lib/vault-download-types";
import { vaultObjectDownloadFilename } from "@/lib/vault-catalog";
import type { VaultCatalogObject } from "@/lib/vault-catalog-types";
import {
  type VaultApiContext,
  vaultPresignDownloadPath,
} from "@/lib/vault-api-context";

export class VaultDownloadError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VaultDownloadError";
  }
}

async function requestPresignDownload(
  s3Key: string,
  context: VaultApiContext,
): Promise<VaultPresignDownloadResponse> {
  const body =
    context.scope === "staff"
      ? { s3_key: s3Key, client_id: context.clientId }
      : { s3_key: s3Key };

  const res = await fetch(vaultPresignDownloadPath(context), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseBody = (await res.json().catch(() => ({}))) as
    | VaultPresignDownloadResponse
    | { error?: string };

  if (!res.ok) {
    throw new VaultDownloadError(
      "error" in responseBody && responseBody.error
        ? responseBody.error
        : `Presign failed (${res.status})`,
      res.status,
    );
  }

  return responseBody as VaultPresignDownloadResponse;
}

export async function downloadVaultObject(
  item: VaultCatalogObject,
  context: VaultApiContext = { scope: "client" },
): Promise<VaultDownloadResult> {
  const trimmedKey = item.s3_key.trim();
  if (!trimmedKey) {
    throw new VaultDownloadError("Object key is required");
  }

  const presign = await requestPresignDownload(trimmedKey, context);

  const getRes = await fetch(presign.url);
  if (!getRes.ok) {
    const detail = await getRes.text().catch(() => "");
    throw new VaultDownloadError(
      detail
        ? `Download from storage failed (${getRes.status}): ${detail.slice(0, 200)}`
        : `Download from storage failed (${getRes.status})`,
      getRes.status,
    );
  }

  const blob = await getRes.blob();
  const filename = vaultObjectDownloadFilename(item);
  const objectUrl = URL.createObjectURL(blob);

  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  return {
    ...presign,
    bytes: blob.size,
  };
}
