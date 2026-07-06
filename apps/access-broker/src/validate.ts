import type { VaultPrefix } from "./types.js";

const ALLOWED_PREFIXES: VaultPrefix[] = ["raw", "derived", "context", "audit"];

const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

const CONTENT_TYPE_EXTENSION: Record<string, string> = {
  "application/pdf": "pdf",
  "text/csv": "csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
};

export function normalizeVaultPrefix(prefix: string | undefined): VaultPrefix {
  if (prefix && ALLOWED_PREFIXES.includes(prefix as VaultPrefix)) {
    return prefix as VaultPrefix;
  }

  return "raw";
}

export function validateUploadInput(input: {
  filename: string;
  content_type: string;
  source: string;
  prefix?: string;
}): { contentType: string; sourceSlug: string; prefix: VaultPrefix } {
  const contentType = input.content_type.trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error(`Unsupported content type: ${input.content_type}`);
  }

  const sourceSlug = slugifySegment(input.source);
  if (!sourceSlug) {
    throw new Error("Source label is required");
  }

  const filename = input.filename.trim();
  if (!filename || filename.length > 255) {
    throw new Error("Invalid filename");
  }

  return {
    contentType,
    sourceSlug,
    prefix: normalizeVaultPrefix(input.prefix),
  };
}

export function validateUploadPrefix(prefix: VaultPrefix): void {
  if (prefix !== "raw") {
    throw new Error("Browser uploads must target the raw/ prefix");
  }
}

export function validateObjectKey(s3Key: string): VaultPrefix {
  const key = s3Key.trim();
  if (!key || key.includes("..") || key.startsWith("/")) {
    throw new Error("Invalid object key");
  }

  const prefix = key.split("/")[0] as VaultPrefix;
  if (!ALLOWED_PREFIXES.includes(prefix)) {
    throw new Error("Object key outside allowed Vault prefixes");
  }

  return prefix;
}

export function extensionForUpload(
  filename: string,
  contentType: string,
): string {
  const fromName = filename.includes(".")
    ? filename.split(".").pop()?.toLowerCase()
    : undefined;

  if (fromName && /^[a-z0-9]{1,10}$/.test(fromName)) {
    return fromName;
  }

  return CONTENT_TYPE_EXTENSION[contentType] ?? "bin";
}

export function buildUploadObjectKey(input: {
  prefix: VaultPrefix;
  sourceSlug: string;
  extension: string;
  now?: Date;
}): string {
  const timestamp = (input.now ?? new Date()).toISOString().replace(/[:.]/g, "-");
  const suffix = randomSuffix();
  return `${input.prefix}/${input.sourceSlug}/${timestamp}Z-${suffix}.${input.extension}`;
}

function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}
