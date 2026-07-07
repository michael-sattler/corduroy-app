import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faFile,
  faFileCsv,
  faFileExcel,
  faFileLines,
  faFilePdf,
} from "@fortawesome/free-solid-svg-icons";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  VaultCatalogGroup,
  VaultCatalogObject,
  VaultCatalogResponse,
} from "@/lib/vault-catalog-types";

const VAULT_OBJECT_COLUMNS_BASE =
  "id, s3_key, prefix, object_type, source, size_bytes, created_at";

export const VAULT_OBJECT_COLUMNS_WITH_CLASSIFICATION = `${VAULT_OBJECT_COLUMNS_BASE}, category, is_latest, is_ignored, is_processed, is_hidden, classified_at, classified_by`;

type PostgresErrorLike = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

function postgresErrorText(error: PostgresErrorLike): string {
  return [error.message, error.details, error.hint, error.code]
    .filter(Boolean)
    .join(" ");
}

function shouldFallbackToBaseCatalog(error: PostgresErrorLike): boolean {
  const text = postgresErrorText(error).toLowerCase();

  if (
    text.includes("permission denied") ||
    text.includes("jwt") ||
    text.includes("not authorized")
  ) {
    return false;
  }

  return (
    error.code === "42703" ||
    text.includes("does not exist") ||
    text.includes("category") ||
    text.includes("is_latest") ||
    text.includes("is_hidden") ||
    text.includes("is_ignored") ||
    text.includes("is_processed") ||
    text.includes("classified_")
  );
}

export function normalizeVaultObject(row: Record<string, unknown>): VaultCatalogObject {
  return {
    id: String(row.id),
    s3_key: String(row.s3_key),
    prefix: String(row.prefix),
    object_type: String(row.object_type),
    source: String(row.source ?? ""),
    size_bytes:
      row.size_bytes == null || row.size_bytes === ""
        ? null
        : Number(row.size_bytes),
    created_at: String(row.created_at),
    category: typeof row.category === "string" ? row.category : null,
    is_latest: row.is_latest === true,
    is_ignored: row.is_ignored === true,
    is_processed: row.is_processed === true,
    is_hidden: row.is_hidden === true,
    classified_at:
      typeof row.classified_at === "string" ? row.classified_at : null,
    classified_by:
      typeof row.classified_by === "string" ? row.classified_by : null,
  };
}

export async function listVaultObjects(
  supabase: SupabaseClient,
  clientId?: string,
): Promise<{ objects: VaultCatalogObject[]; classificationReady: boolean }> {
  const runQuery = async (columns: string) => {
    let query = supabase
      .from("vault_objects")
      .select(columns)
      .order("created_at", { ascending: false });

    if (clientId) {
      query = query.eq("client_id", clientId);
    }

    return query;
  };

  const withClassification = await runQuery(VAULT_OBJECT_COLUMNS_WITH_CLASSIFICATION);

  if (!withClassification.error) {
    return {
      classificationReady: true,
      objects: (withClassification.data ?? []).map((row) =>
        normalizeVaultObject(row as unknown as Record<string, unknown>),
      ),
    };
  }

  if (shouldFallbackToBaseCatalog(withClassification.error)) {
    const base = await runQuery(VAULT_OBJECT_COLUMNS_BASE);

    if (base.error) {
      throw new Error(`Vault catalog query failed: ${postgresErrorText(base.error)}`);
    }

    return {
      classificationReady: false,
      objects: (base.data ?? []).map((row) =>
        normalizeVaultObject(row as unknown as Record<string, unknown>),
      ),
    };
  }

  throw new Error(
    `Vault catalog query failed: ${postgresErrorText(withClassification.error)}`,
  );
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
  clientId?: string,
): Promise<VaultCatalogResponse> {
  const { objects, classificationReady } = await listVaultObjects(supabase, clientId);
  const visible = objects.filter((object) => !object.is_hidden);
  const hidden = objects.filter((object) => object.is_hidden);

  return {
    objects,
    groups: groupVaultObjectsBySource(visible),
    hiddenGroups: groupVaultObjectsBySource(hidden),
    count: objects.length,
    visibleCount: visible.length,
    hiddenCount: hidden.length,
    classificationReady,
  };
}

export function vaultObjectDisplayTitle(object: VaultCatalogObject): string {
  const basename = object.s3_key.split("/").pop()?.trim() ?? "";
  const source = object.source.trim();

  if (source) {
    const label = humanizeVaultSource(source);
    const extension = extensionFromBasename(basename);
    if (extension && !label.toLowerCase().endsWith(`.${extension}`)) {
      return `${label}.${extension}`;
    }
    return label;
  }

  if (basename) {
    return basename;
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

export function vaultObjectIconDefinition(objectType: string): IconDefinition {
  switch (objectType) {
    case "pdf":
      return faFilePdf;
    case "spreadsheet":
      return faFileExcel;
    case "csv":
      return faFileCsv;
    case "document":
      return faFileLines;
    default:
      return faFile;
  }
}

export function formatVaultObjectMeta(object: VaultCatalogObject): string {
  const uploaded = formatVaultDate(object.created_at);
  const size = formatVaultBytes(object.size_bytes);
  return size ? `Uploaded ${uploaded} · ${size}` : `Uploaded ${uploaded}`;
}

export function vaultObjectDownloadFilename(object: VaultCatalogObject): string {
  const basename = object.s3_key.split("/").pop()?.trim() ?? "";
  if (basename && !isGeneratedVaultBasename(basename)) {
    return basename;
  }

  const title = vaultObjectDisplayTitle(object);
  const extension = extensionFromBasename(basename);
  if (extension && !title.toLowerCase().endsWith(`.${extension}`)) {
    return `${title}.${extension}`;
  }

  return title || "vault-file";
}

function extensionFromBasename(basename: string): string | undefined {
  if (!basename.includes(".")) {
    return undefined;
  }

  const extension = basename.split(".").pop()?.toLowerCase();
  if (!extension || !/^[a-z0-9]{1,10}$/.test(extension)) {
    return undefined;
  }

  return extension;
}

function isGeneratedVaultBasename(basename: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T.*Z-[a-z0-9]+\.[a-z0-9]+$/i.test(basename);
}

function formatVaultDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  // Fixed locale + UTC so SSR (Node) and browser hydration produce identical text.
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
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
