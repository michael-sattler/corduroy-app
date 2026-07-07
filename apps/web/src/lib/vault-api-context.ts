export type VaultApiContext =
  | { scope: "client" }
  | { scope: "staff"; clientId: string };

export function vaultPresignUploadPath(context: VaultApiContext): string {
  return context.scope === "staff"
    ? "/api/staff/vault/presign-upload"
    : "/api/client/vault/presign-upload";
}

export function vaultPresignDownloadPath(context: VaultApiContext): string {
  return context.scope === "staff"
    ? "/api/staff/vault/presign-download"
    : "/api/client/vault/presign-download";
}

export function vaultObjectsPath(context: VaultApiContext): string {
  if (context.scope === "staff") {
    return `/api/staff/vault/objects?client_id=${encodeURIComponent(context.clientId)}`;
  }

  return "/api/client/vault/objects";
}
