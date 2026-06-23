export type Surface = "client" | "staff" | "unknown";

const CLIENT_HOST_PREFIXES = ["app."];
const STAFF_HOST_PREFIXES = ["staff."];

function stripPort(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

export function getSurfaceFromHost(host: string): Surface {
  const hostname = stripPort(host);

  if (CLIENT_HOST_PREFIXES.some((prefix) => hostname.startsWith(prefix))) {
    return "client";
  }

  if (STAFF_HOST_PREFIXES.some((prefix) => hostname.startsWith(prefix))) {
    return "staff";
  }

  return "unknown";
}

export function surfaceBasePath(surface: Surface): string | null {
  if (surface === "client") return "/client";
  if (surface === "staff") return "/staff";
  return null;
}
