import type {
  VaultPresignDownloadResponse,
  VaultDownloadResult,
} from "@/lib/vault-download-types";
import { vaultObjectDownloadFilename } from "@/lib/vault-catalog";

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
): Promise<VaultPresignDownloadResponse> {
  const res = await fetch("/api/client/vault/presign-download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ s3_key: s3Key }),
  });

  const body = (await res.json().catch(() => ({}))) as
    | VaultPresignDownloadResponse
    | { error?: string };

  if (!res.ok) {
    throw new VaultDownloadError(
      "error" in body && body.error
        ? body.error
        : `Presign failed (${res.status})`,
      res.status,
    );
  }

  return body as VaultPresignDownloadResponse;
}

export async function downloadVaultObject(
  s3Key: string,
): Promise<VaultDownloadResult> {
  const trimmedKey = s3Key.trim();
  if (!trimmedKey) {
    throw new VaultDownloadError("Object key is required");
  }

  const presign = await requestPresignDownload(trimmedKey);

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
  const filename = vaultObjectDownloadFilename(trimmedKey);
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
