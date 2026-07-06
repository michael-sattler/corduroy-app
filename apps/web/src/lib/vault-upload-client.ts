import {
  resolveVaultContentType,
  type VaultPresignUploadResponse,
  type VaultUploadResult,
} from "@/lib/vault-upload-types";

export class VaultUploadError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VaultUploadError";
  }
}

async function requestPresign(input: {
  filename: string;
  content_type: string;
  source: string;
}): Promise<VaultPresignUploadResponse> {
  const res = await fetch("/api/client/vault/presign-upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const body = (await res.json().catch(() => ({}))) as
    | VaultPresignUploadResponse
    | { error?: string };

  if (!res.ok) {
    throw new VaultUploadError(
      "error" in body && body.error
        ? body.error
        : `Presign failed (${res.status})`,
      res.status,
    );
  }

  return body as VaultPresignUploadResponse;
}

export async function uploadVaultFile(
  file: File,
  source: string,
): Promise<VaultUploadResult> {
  const trimmedSource = source.trim();
  if (!trimmedSource) {
    throw new VaultUploadError("Source label is required");
  }

  const contentType = resolveVaultContentType(file);
  if (!contentType) {
    throw new VaultUploadError(
      "Unsupported file type. Use PDF, CSV, XLSX, XLS, DOCX, or DOC.",
    );
  }

  const presign = await requestPresign({
    filename: file.name,
    content_type: contentType,
    source: trimmedSource,
  });

  const putRes = await fetch(presign.url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });

  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => "");
    throw new VaultUploadError(
      detail
        ? `Upload to storage failed (${putRes.status}): ${detail.slice(0, 200)}`
        : `Upload to storage failed (${putRes.status})`,
      putRes.status,
    );
  }

  return {
    ...presign,
    size_bytes: file.size,
  };
}
