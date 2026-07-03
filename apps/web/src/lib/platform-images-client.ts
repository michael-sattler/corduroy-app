export function withImageCacheBuster(
  imagePath: string | null | undefined,
  version: string | number | null | undefined,
): string | null {
  if (!imagePath) return null;
  if (version === null || version === undefined || version === "") {
    return imagePath;
  }
  const numeric =
    typeof version === "number" ? version : new Date(version).getTime();
  if (Number.isNaN(numeric)) return imagePath;
  return `${imagePath}?v=${numeric}`;
}
