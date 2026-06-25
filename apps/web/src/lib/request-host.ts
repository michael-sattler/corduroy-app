import "server-only";

import { headers } from "next/headers";

/** Map bind-all addresses to a browser-reachable dev hostname. */
export function normalizeBindHostname(hostname: string): string {
  const lower = hostname.toLowerCase();
  if (lower === "0.0.0.0" || lower === "[::]" || lower === "::") {
    return "localhost";
  }
  if (lower === "app.0.0.0.0") {
    return "app.localhost";
  }
  if (lower === "staff.0.0.0.0") {
    return "staff.localhost";
  }
  return hostname;
}

/** Normalize Host / x-forwarded-host (may include port). */
export function normalizeRequestHost(host: string): string {
  const normalized = host.toLowerCase().trim();
  if (!normalized) {
    return "localhost:3000";
  }

  const colonIdx = normalized.lastIndexOf(":");
  if (colonIdx !== -1 && !normalized.includes("]")) {
    const maybePort = normalized.slice(colonIdx + 1);
    if (/^\d+$/.test(maybePort)) {
      const hostname = normalizeBindHostname(normalized.slice(0, colonIdx));
      return `${hostname}:${maybePort}`;
    }
  }

  return normalizeBindHostname(normalized);
}

export async function getRequestHost(): Promise<string> {
  const headerStore = await headers();
  const raw =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    "localhost:3000";
  return normalizeRequestHost(raw);
}

export function getRequestHostFromHeaders(
  headerStore: Headers,
  fallback = "localhost:3000",
): string {
  const raw =
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host") ??
    fallback;
  return normalizeRequestHost(raw);
}
