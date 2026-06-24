import {
  isPathBasedHost,
  pathPrefixForSurface,
  withAppPath,
} from "@/lib/path-routing";

export type SurfaceDashboardLink = {
  href: string;
  label: string;
};

export type SurfaceDashboardLinks = {
  client: SurfaceDashboardLink;
  staff: SurfaceDashboardLink;
  isLocal: boolean;
  isPathBased: boolean;
};

function splitHost(host: string): { hostname: string; port: string | null } {
  const normalized = host.toLowerCase().trim();

  const colonIdx = normalized.lastIndexOf(":");
  if (colonIdx !== -1 && !normalized.includes("]")) {
    const maybePort = normalized.slice(colonIdx + 1);
    if (/^\d+$/.test(maybePort)) {
      return {
        hostname: normalized.slice(0, colonIdx),
        port: maybePort,
      };
    }
  }

  return { hostname: normalized, port: null };
}

function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  );
}

function localDevHostname(hostname: string): string {
  if (hostname === "127.0.0.1") {
    return "localhost";
  }
  return hostname;
}

function originFor(
  surface: "client" | "staff",
  hostname: string,
  port: string | null,
  protocol: string,
): string {
  const prefix = surface === "client" ? "app" : "staff";
  const portSuffix = port ? `:${port}` : "";

  if (isLocalHostname(hostname)) {
    const devHost = localDevHostname(hostname);
    return `${protocol}://${prefix}.${devHost}${portSuffix}`;
  }

  if (hostname.startsWith("app.")) {
    const base = hostname.slice(4);
    if (surface === "client") {
      return `${protocol}://${hostname}${portSuffix}`;
    }
    return `${protocol}://staff.${base}${portSuffix}`;
  }

  if (hostname.startsWith("staff.")) {
    const base = hostname.slice(6);
    if (surface === "staff") {
      return `${protocol}://${hostname}${portSuffix}`;
    }
    return `${protocol}://app.${base}${portSuffix}`;
  }

  return `${protocol}://${prefix}.${hostname}${portSuffix}`;
}

function toDashboardLink(origin: string): SurfaceDashboardLink {
  const trimmed = origin.replace(/\/$/, "");
  return {
    href: `${trimmed}/dashboard`,
    label: trimmed.replace(/^https?:\/\//, ""),
  };
}

export function getSurfaceDashboardLinks(
  host: string,
  protocol = "http",
): SurfaceDashboardLinks {
  const normalizedProto = protocol === "https" ? "https" : "http";
  const { hostname, port } = splitHost(host);

  if (isPathBasedHost(host)) {
    const portSuffix = port ? `:${port}` : "";
    return {
      client: {
        href: withAppPath("/dashboard", pathPrefixForSurface("client")),
        label: `${hostname}${portSuffix}/app`,
      },
      staff: {
        href: withAppPath("/dashboard", pathPrefixForSurface("staff")),
        label: `${hostname}${portSuffix}/staff`,
      },
      isLocal: false,
      isPathBased: true,
    };
  }

  const clientOrigin =
    process.env.NEXT_PUBLIC_CLIENT_ORIGIN?.replace(/\/$/, "") ??
    originFor("client", hostname, port, normalizedProto);

  const staffOrigin =
    process.env.NEXT_PUBLIC_STAFF_ORIGIN?.replace(/\/$/, "") ??
    originFor("staff", hostname, port, normalizedProto);

  return {
    client: toDashboardLink(clientOrigin),
    staff: toDashboardLink(staffOrigin),
    isLocal: isLocalHostname(hostname),
    isPathBased: false,
  };
}
