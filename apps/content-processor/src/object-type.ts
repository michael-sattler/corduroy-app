export function objectTypeFromContentType(contentType: string | undefined): string {
  const normalized = contentType?.trim().toLowerCase() ?? "";

  if (normalized === "application/pdf") {
    return "pdf";
  }
  if (normalized === "text/csv") {
    return "csv";
  }
  if (
    normalized === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    normalized === "application/vnd.ms-excel"
  ) {
    return "spreadsheet";
  }
  if (
    normalized === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    normalized === "application/msword"
  ) {
    return "document";
  }

  return "unknown";
}
