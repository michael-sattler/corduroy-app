export type ParsedVaultKey = {
  prefix: "raw" | "derived" | "context" | "audit";
  source: string;
};

const ALLOWED_PREFIXES = new Set(["raw", "derived", "context", "audit"]);

export function parseVaultObjectKey(s3Key: string): ParsedVaultKey | null {
  const key = s3Key.trim();
  if (!key || key.includes("..") || key.startsWith("/")) {
    return null;
  }

  const segments = key.split("/");
  const prefix = segments[0];

  if (!ALLOWED_PREFIXES.has(prefix)) {
    return null;
  }

  const source = segments[1]?.trim() ?? "";

  return {
    prefix: prefix as ParsedVaultKey["prefix"],
    source,
  };
}
