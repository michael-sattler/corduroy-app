import { cookies, headers } from "next/headers";
import {
  PRESENCE_BRIDGE_COOKIE,
  PRESENCE_BRIDGE_REF_COOKIE,
  PRESENCE_CLIENT_COOKIE,
  PRESENCE_STAFF_COOKIE,
} from "@/lib/auth/landing-presence-cookies";

export {
  PRESENCE_BRIDGE_COOKIE,
  PRESENCE_BRIDGE_REF_COOKIE,
  PRESENCE_CLIENT_COOKIE,
  PRESENCE_STAFF_COOKIE,
} from "@/lib/auth/landing-presence-cookies";

type PresenceRecord = {
  staff?: string;
  client?: string;
};

type PresenceStore = Map<string, PresenceRecord>;

function store(): PresenceStore {
  const g = globalThis as typeof globalThis & {
    __corduroyLandingPresence?: PresenceStore;
  };
  if (!g.__corduroyLandingPresence) {
    g.__corduroyLandingPresence = new Map();
  }
  return g.__corduroyLandingPresence;
}

function hostnameFromHost(host: string): string {
  const normalized = host.toLowerCase().trim();
  const colonIdx = normalized.lastIndexOf(":");
  if (colonIdx !== -1 && !normalized.includes("]")) {
    const maybePort = normalized.slice(colonIdx + 1);
    if (/^\d+$/.test(maybePort)) {
      return normalized.slice(0, colonIdx);
    }
  }
  return normalized;
}

/** Parent domain for shared cookies, or null when PSL (localhost) forbids it. */
export function sharedCookieDomain(hostname: string): string | null {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  ) {
    return null;
  }

  const parts = hostname.split(".").filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  return `.${parts.slice(-2).join(".")}`;
}

export function withBridgeQuery(href: string, bridge: string): string {
  try {
    if (href.startsWith("http://") || href.startsWith("https://")) {
      const url = new URL(href);
      url.searchParams.set("bridge", bridge);
      return url.toString();
    }
    const url = new URL(href, "http://corduroy.local");
    url.searchParams.set("bridge", bridge);
    return `${url.pathname}${url.search}`;
  } catch {
    return href;
  }
}

/** Read the apex bridge id (middleware creates it on `/`). */
export async function getPresenceBridgeId(): Promise<string> {
  const headersList = await headers();
  const fromMiddleware = headersList.get("x-corduroy-bridge");
  if (fromMiddleware) {
    return fromMiddleware;
  }

  const cookieStore = await cookies();
  return cookieStore.get(PRESENCE_BRIDGE_COOKIE)?.value ?? crypto.randomUUID();
}

export async function readLandingPresence(): Promise<{
  staff: string | null;
  client: string | null;
}> {
  const cookieStore = await cookies();
  const bridge = cookieStore.get(PRESENCE_BRIDGE_COOKIE)?.value;
  const fromStore = bridge ? store().get(bridge) : undefined;

  return {
    staff:
      fromStore?.staff ??
      cookieStore.get(PRESENCE_STAFF_COOKIE)?.value ??
      null,
    client:
      fromStore?.client ??
      cookieStore.get(PRESENCE_CLIENT_COOKIE)?.value ??
      null,
  };
}

async function resolveSharedDomain(): Promise<string | null> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  return sharedCookieDomain(hostnameFromHost(host));
}

export async function recordLandingPresence(
  surface: "staff" | "client",
  displayName: string,
): Promise<void> {
  const name = displayName.trim();
  if (!name) {
    return;
  }

  const cookieStore = await cookies();
  const presenceCookie =
    surface === "staff" ? PRESENCE_STAFF_COOKIE : PRESENCE_CLIENT_COOKIE;
  const domain = await resolveSharedDomain();

  try {
    cookieStore.set(presenceCookie, name, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      ...(domain ? { domain } : {}),
    });
  } catch {
    // Cookie writes fail in RSC; in-memory store still updates below.
  }

  const bridge =
    cookieStore.get(PRESENCE_BRIDGE_REF_COOKIE)?.value ??
    cookieStore.get(PRESENCE_BRIDGE_COOKIE)?.value;
  if (!bridge) {
    return;
  }

  const current = store().get(bridge) ?? {};
  store().set(bridge, { ...current, [surface]: name });
}

export async function clearLandingPresence(
  surface: "staff" | "client",
): Promise<void> {
  const cookieStore = await cookies();
  const presenceCookie =
    surface === "staff" ? PRESENCE_STAFF_COOKIE : PRESENCE_CLIENT_COOKIE;
  const domain = await resolveSharedDomain();

  try {
    cookieStore.set(presenceCookie, "", {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      maxAge: 0,
      ...(domain ? { domain } : {}),
    });
  } catch {
    // Continue clearing the store.
  }

  const bridge =
    cookieStore.get(PRESENCE_BRIDGE_REF_COOKIE)?.value ??
    cookieStore.get(PRESENCE_BRIDGE_COOKIE)?.value;
  if (!bridge) {
    return;
  }

  const current = store().get(bridge);
  if (!current) {
    return;
  }

  const next = { ...current };
  delete next[surface];
  store().set(bridge, next);
}
