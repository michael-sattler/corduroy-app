import {
  resolveVaultContentType,
  type VaultPresignUploadResponse,
  type VaultUploadResult,
} from "@/lib/vault-upload-types";
import {
  type VaultApiContext,
  vaultPresignUploadPath,
} from "@/lib/vault-api-context";

export class VaultUploadError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "VaultUploadError";
  }
}

async function requestPresign(
  input: {
    filename: string;
    content_type: string;
    source: string;
  },
  context: VaultApiContext,
): Promise<VaultPresignUploadResponse> {
  const body =
    context.scope === "staff"
      ? { ...input, client_id: context.clientId }
      : input;

  let res: Response;
  try {
    res = await fetch(vaultPresignUploadPath(context), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new VaultUploadError(
      context.scope === "staff"
        ? "Could not reach staff upload API — restart web/api after deploy?"
        : "Could not reach upload API",
    );
  }

  const responseBody = (await res.json().catch(() => ({}))) as
    | VaultPresignUploadResponse
    | { error?: string };

  if (!res.ok) {
    throw new VaultUploadError(
      "error" in responseBody && responseBody.error
        ? responseBody.error
        : `Presign failed (${res.status})`,
      res.status,
    );
  }

  return responseBody as VaultPresignUploadResponse;
}

export async function uploadVaultFile(
  file: File,
  source: string,
  context: VaultApiContext = { scope: "client" },
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

  const presign = await requestPresign(
    {
      filename: file.name,
      content_type: contentType,
      source: trimmedSource,
    },
    context,
  );

  let putRes: Response;
  try {
    putRes = await fetch(presign.url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
  } catch {
    throw new VaultUploadError(
      context.scope === "staff"
        ? "Browser blocked upload to storage — staff origin must be on the Vault bucket CORS list (staff.localhost / staff.corduroytech.ai)"
        : "Browser blocked upload to storage — check Vault bucket CORS for this app origin",
    );
  }

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
