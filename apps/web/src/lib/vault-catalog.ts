import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  VaultCatalogGroup,
  VaultCatalogObject,
  VaultCatalogResponse,
} from "@/lib/vault-catalog-types";

const VAULT_OBJECT_COLUMNS =
  "id, s3_key, prefix, object_type, source, size_bytes, created_at";

export async function listVaultObjects(
  supabase: SupabaseClient,
): Promise<VaultCatalogObject[]> {
  const { data, error } = await supabase
    .from("vault_objects")
    .select(VAULT_OBJECT_COLUMNS)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Vault catalog query failed: ${error.message}`);
  }

  return (data ?? []) as VaultCatalogObject[];
}

export function humanizeVaultSource(source: string): string {
  const trimmed = source.trim();
  if (!trimmed) {
    return "Other";
  }

  return trimmed
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function groupVaultObjectsBySource(
  objects: VaultCatalogObject[],
): VaultCatalogGroup[] {
  const bySource = new Map<string, VaultCatalogObject[]>();

  for (const object of objects) {
    const source = object.source.trim() || "other";
    const bucket = bySource.get(source);
    if (bucket) {
      bucket.push(object);
    } else {
      bySource.set(source, [object]);
    }
  }

  return [...bySource.entries()]
    .map(([source, items]) => ({
      source,
      label: humanizeVaultSource(source),
      items: items.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function loadVaultCatalog(
  supabase: SupabaseClient,
): Promise<VaultCatalogResponse> {
  const objects = await listVaultObjects(supabase);
  return {
    objects,
    groups: groupVaultObjectsBySource(objects),
    count: objects.length,
  };
}

export function vaultObjectDisplayTitle(object: VaultCatalogObject): string {
  const basename = object.s3_key.split("/").pop() ?? object.s3_key;
  const extension = basename.includes(".")
    ? basename.split(".").pop()?.toLowerCase()
    : undefined;

  if (extension && /^[a-z0-9]{1,10}$/.test(extension)) {
    return `${extension.toUpperCase()} file`;
  }

  return formatVaultObjectType(object.object_type);
}

export function formatVaultObjectType(objectType: string): string {
  switch (objectType) {
    case "pdf":
      return "PDF file";
    case "spreadsheet":
      return "Spreadsheet";
    case "document":
      return "Document";
    case "csv":
      return "CSV file";
    default:
      return "File";
  }
}

export function vaultObjectTagClass(objectType: string): string {
  switch (objectType) {
    case "pdf":
      return "tag-green";
    case "spreadsheet":
    case "csv":
      return "tag-green";
    case "document":
      return "tag-blue";
    default:
      return "tag-muted";
  }
}

export function vaultObjectTagLabel(object: VaultCatalogObject): string {
  const fromType = object.object_type.trim().toLowerCase();
  if (fromType === "spreadsheet") {
    return "XLSX";
  }
  if (fromType && fromType !== "unknown") {
    return fromType.toUpperCase();
  }

  const basename = object.s3_key.split("/").pop() ?? "";
  const extension = basename.includes(".")
    ? basename.split(".").pop()?.toUpperCase()
    : undefined;
  return extension ?? "FILE";
}

export function vaultObjectIcon(objectType: string): string {
  switch (objectType) {
    case "spreadsheet":
    case "csv":
      return "📊";
    case "document":
      return "📋";
    default:
      return "📄";
  }
}

export function formatVaultObjectMeta(object: VaultCatalogObject): string {
  const uploaded = formatVaultDate(object.created_at);
  const size = formatVaultBytes(object.size_bytes);
  return size ? `Uploaded ${uploaded} · ${size}` : `Uploaded ${uploaded}`;
}

function formatVaultDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatVaultBytes(sizeBytes: number | null): string | null {
  if (sizeBytes == null || sizeBytes < 0) {
    return null;
  }

  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(sizeBytes < 10_240 ? 1 : 0)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}
