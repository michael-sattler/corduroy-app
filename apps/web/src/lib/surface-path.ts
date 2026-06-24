import { headers } from "next/headers";
import type { AppSurface } from "@/components/layout/nav-config";
import {
  SURFACE_PATH_PREFIX_HEADER,
  getPathPrefixFromPathname,
  isPathBasedHost,
  pathPrefixForSurface,
  withAppPath,
} from "@/lib/path-routing";

const SURFACE_HEADER = "x-corduroy-surface";

function inferSurfaceFromRequest(headerStore: Headers): AppSurface | undefined {
  const fromMiddleware = headerStore.get(SURFACE_HEADER);
  if (fromMiddleware === "client" || fromMiddleware === "staff") {
    return fromMiddleware;
  }

  const nextUrl = headerStore.get("next-url") ?? "";
  if (nextUrl.startsWith("/app")) {
    return "client";
  }
  if (nextUrl.startsWith("/staff")) {
    return "staff";
  }

  const referer = headerStore.get("referer") ?? "";
  if (referer.includes("/app/") || referer.endsWith("/app")) {
    return "client";
  }
  if (referer.includes("/staff/") || referer.endsWith("/staff")) {
    return "staff";
  }

  try {
    const refererPath = new URL(referer).pathname;
    const prefix = getPathPrefixFromPathname(refererPath);
    if (prefix === "/app") {
      return "client";
    }
    if (prefix === "/staff") {
      return "staff";
    }
  } catch {
    // ignore invalid referer
  }

  return undefined;
}

export async function getSurfacePathPrefix(
  surface?: AppSurface,
): Promise<string> {
  const headerStore = await headers();
  const fromMiddleware = headerStore.get(SURFACE_PATH_PREFIX_HEADER);
  if (fromMiddleware) {
    return fromMiddleware;
  }

  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "";

  if (!isPathBasedHost(host)) {
    return "";
  }

  const resolvedSurface = surface ?? inferSurfaceFromRequest(headerStore);
  if (resolvedSurface) {
    return pathPrefixForSurface(resolvedSurface);
  }

  return "";
}

export async function resolveAppHref(
  path: string,
  surface?: AppSurface,
): Promise<string> {
  const prefix = await getSurfacePathPrefix(surface);
  return withAppPath(path, prefix);
}
