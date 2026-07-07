export type VaultPresignUploadRequest = {
  filename: string;
  content_type: string;
  source: string;
  reason?: string;
};

export type VaultPresignUploadResponse = {
  operation: "presign_put";
  client_id: string;
  bucket_name: string;
  s3_key: string;
  s3_prefix: string;
  url: string;
  expires_in: number;
  audit_event_id: string;
};

export type VaultUploadResult = VaultPresignUploadResponse & {
  size_bytes: number;
};

export const VAULT_UPLOAD_ACCEPT =
  ".pdf,.csv,.xlsx,.xls,.docx,.doc,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword";

const EXTENSION_CONTENT_TYPE: Record<string, string> = {
  pdf: "application/pdf",
  csv: "text/csv",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
};

export function resolveVaultContentType(file: File): string | null {
  const fromBrowser = file.type.trim().toLowerCase();
  if (fromBrowser) {
    return fromBrowser;
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_CONTENT_TYPE[extension] ?? null;
}

/** Filename stem used as Vault source label (slugified server-side). */
export function vaultSourceFromFilename(filename: string): string {
  const trimmed = filename.trim();
  if (!trimmed) {
    return "upload";
  }

  const stem = trimmed.includes(".")
    ? trimmed.slice(0, trimmed.lastIndexOf("."))
    : trimmed;

  return stem.trim() || trimmed;
}
