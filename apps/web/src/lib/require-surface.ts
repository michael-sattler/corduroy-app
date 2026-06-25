import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getPathPrefixFromPathname } from "@/lib/path-routing";
import { normalizeRequestHost } from "@/lib/request-host";
import { getSurfaceFromHost } from "@/lib/subdomain";

export type AppSurface = "client" | "staff";

const SURFACE_HEADER = "x-corduroy-surface";

function surfaceFromPathname(pathname: string): AppSurface | null {
  const prefix = getPathPrefixFromPathname(pathname);
  if (prefix === "/app") return "client";
  if (prefix === "/staff") return "staff";
  return null;
}

export async function requireSurface(): Promise<AppSurface> {
  const headerStore = await headers();

  const fromMiddleware = headerStore.get(SURFACE_HEADER);
  if (fromMiddleware === "client" || fromMiddleware === "staff") {
    return fromMiddleware;
  }

  const host = normalizeRequestHost(
    headerStore.get("x-forwarded-host") ??
      headerStore.get("host") ??
      "",
  );
  const fromHost = getSurfaceFromHost(host);
  if (fromHost === "client" || fromHost === "staff") {
    return fromHost;
  }

  const pathHint =
    headerStore.get("next-url") ??
    headerStore.get("x-invoke-path") ??
    headerStore.get("x-matched-path") ??
    "";
  const fromPath = surfaceFromPathname(pathHint);
  if (fromPath) {
    return fromPath;
  }

  notFound();
}
