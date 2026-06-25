import "server-only";

import { cookies, headers } from "next/headers";
import {
  getSurfaceDashboardLinks,
} from "@/lib/surface-urls";
import {
  masqueradeCookieName,
  parseMasqueradeSession,
  type MasqueradeSession,
} from "@/lib/impersonation";
import {
  isPathBasedHost,
  pathPrefixForSurface,
  withAppPath,
} from "@/lib/path-routing";
import { getRequestHost, getRequestHostFromHeaders } from "@/lib/request-host";

export async function readMasqueradeSession(): Promise<MasqueradeSession | null> {
  const cookieStore = await cookies();
  return parseMasqueradeSession(cookieStore.get(masqueradeCookieName())?.value);
}

export async function buildClientImpersonateUrl(token: string): Promise<string> {
  const headerStore = await headers();
  const host = await getRequestHost();
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const links = getSurfaceDashboardLinks(host, proto);

  if (links.isPathBased) {
    const path = withAppPath(
      "/auth/impersonate",
      pathPrefixForSurface("client"),
    );
    return `${proto}://${host}${path}?token=${encodeURIComponent(token)}`;
  }

  const clientBase = links.client.href.replace(/\/dashboard$/, "");
  return `${clientBase}/auth/impersonate?token=${encodeURIComponent(token)}`;
}

export async function buildStaffReturnUrl(
  clientId: string,
  pathPrefix: string,
): Promise<string> {
  const headerStore = await headers();
  const host = await getRequestHost();
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (isPathBasedHost(host)) {
    const path = withAppPath(`/admin/clients/${clientId}`, pathPrefix);
    return `${proto}://${host}${path}`;
  }

  const links = getSurfaceDashboardLinks(host, proto);
  const staffBase = links.staff.href.replace(/\/dashboard$/, "");
  return `${staffBase}/admin/clients/${clientId}`;
}

export async function buildEndMasqueradePath(): Promise<string> {
  const headerStore = await headers();
  const host = getRequestHostFromHeaders(headerStore);

  if (isPathBasedHost(host)) {
    return withAppPath("/auth/end-impersonate", pathPrefixForSurface("client"));
  }

  return "/auth/end-impersonate";
}
