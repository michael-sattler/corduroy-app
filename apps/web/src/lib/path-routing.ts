export const CLIENT_PATH_PREFIX = "/app";
export const STAFF_PATH_PREFIX = "/staff";

export const SURFACE_PATH_PREFIX_HEADER = "x-corduroy-path-prefix";

function stripPort(host: string): string {
  return host.split(":")[0]?.toLowerCase() ?? "";
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

/** Vercel preview hosts use /app and /staff path prefixes instead of subdomains. */
export function isPathBasedHost(host: string): boolean {
  const hostname = stripPort(host);

  if (hostname.startsWith("app.") || hostname.startsWith("staff.")) {
    return false;
  }

  if (isLocalHostname(hostname)) {
    return false;
  }

  return hostname.endsWith(".vercel.app");
}

export function getPathPrefixFromPathname(pathname: string): string {
  if (pathname === CLIENT_PATH_PREFIX || pathname.startsWith(`${CLIENT_PATH_PREFIX}/`)) {
    return CLIENT_PATH_PREFIX;
  }

  if (pathname === STAFF_PATH_PREFIX || pathname.startsWith(`${STAFF_PATH_PREFIX}/`)) {
    return STAFF_PATH_PREFIX;
  }

  return "";
}

export function pathPrefixForSurface(surface: "client" | "staff"): string {
  return surface === "client" ? CLIENT_PATH_PREFIX : STAFF_PATH_PREFIX;
}

export function parsePathBasedRoute(pathname: string): {
  surface: "client" | "staff";
  prefix: string;
  internalPath: string;
} | null {
  if (pathname === CLIENT_PATH_PREFIX || pathname.startsWith(`${CLIENT_PATH_PREFIX}/`)) {
    const remainder = pathname.slice(CLIENT_PATH_PREFIX.length);
    return {
      surface: "client",
      prefix: CLIENT_PATH_PREFIX,
      internalPath: remainder || "/dashboard",
    };
  }

  if (pathname === STAFF_PATH_PREFIX || pathname.startsWith(`${STAFF_PATH_PREFIX}/`)) {
    const remainder = pathname.slice(STAFF_PATH_PREFIX.length);
    return {
      surface: "staff",
      prefix: STAFF_PATH_PREFIX,
      internalPath: remainder || "/dashboard",
    };
  }

  return null;
}

export function withAppPath(path: string, pathPrefix: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!pathPrefix) {
    return normalized;
  }
  return `${pathPrefix}${normalized}`;
}
