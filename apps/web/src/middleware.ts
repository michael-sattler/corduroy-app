import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { readUserRole, roleForSurface } from "@/lib/auth/roles";
import {
  isPathBasedHost,
  parsePathBasedRoute,
  withAppPath,
} from "@/lib/path-routing";
import { getSurfaceFromHost } from "@/lib/subdomain";

type ResolvedRouting = {
  surface: "client" | "staff";
  pathPrefix: string;
  internalPath: string;
  pathBased: boolean;
};

function resolveRouting(host: string, pathname: string): ResolvedRouting | null {
  const subdomainSurface = getSurfaceFromHost(host);

  if (subdomainSurface === "client" || subdomainSurface === "staff") {
    return {
      surface: subdomainSurface,
      pathPrefix: "",
      internalPath: pathname,
      pathBased: false,
    };
  }

  if (!isPathBasedHost(host)) {
    return null;
  }

  const parsed = parsePathBasedRoute(pathname);
  if (!parsed) {
    return null;
  }

  return {
    surface: parsed.surface,
    pathPrefix: parsed.prefix,
    internalPath: parsed.internalPath,
    pathBased: true,
  };
}

function surfaceRequestHeaders(
  request: NextRequest,
  routing: ResolvedRouting,
): Headers {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-corduroy-surface", routing.surface);

  if (routing.pathPrefix) {
    requestHeaders.set("x-corduroy-path-prefix", routing.pathPrefix);
  }

  return requestHeaders;
}

function nextWithSurface(
  request: NextRequest,
  routing: ResolvedRouting,
): NextResponse {
  return NextResponse.next({
    request: { headers: surfaceRequestHeaders(request, routing) },
  });
}

function copyResponseCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach(({ name, value, ...options }) => {
    to.cookies.set(name, value, options);
  });
}

function redirectTo(
  request: NextRequest,
  path: string,
  pathPrefix: string,
  source?: NextResponse,
  searchParams?: Record<string, string>,
): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = withAppPath(path, pathPrefix);
  url.search = "";
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  const redirectResponse = NextResponse.redirect(url);
  if (source) {
    copyResponseCookies(source, redirectResponse);
  }
  return redirectResponse;
}

const CLIENT_PROTECTED = new Set(["/dashboard", "/vault", "/plan"]);

function isStaffProtected(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/admin");
}

function isProtectedPath(pathname: string, surface: "client" | "staff"): boolean {
  if (surface === "client") {
    return CLIENT_PROTECTED.has(pathname);
  }
  return isStaffProtected(pathname);
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;
  const routing = resolveRouting(host, pathname);

  if (!routing) {
    return NextResponse.next();
  }

  const { pathPrefix, internalPath, surface } = routing;

  if (routing.pathBased && pathname === pathPrefix) {
    return NextResponse.redirect(
      new URL(withAppPath("/dashboard", pathPrefix), request.url),
    );
  }

  if (!routing.pathBased && pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isLoginPage = internalPath === "/login";
  const isProtected = isProtectedPath(internalPath, surface);

  if (!isLoginPage && !isProtected) {
    return nextWithSurface(request, routing);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtected) {
      return redirectTo(request, "/login", pathPrefix);
    }
    return nextWithSurface(request, routing);
  }

  const surfaceHeaders = surfaceRequestHeaders(request, routing);
  let response = NextResponse.next({
    request: { headers: surfaceHeaders },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request: { headers: surfaceHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const expectedRole = roleForSurface(surface);

  if (user) {
    const role = readUserRole(user.app_metadata);

    if (role !== expectedRole && !isLoginPage) {
      await supabase.auth.signOut();
      return redirectTo(request, "/login", pathPrefix, response, {
        error: "wrong_surface",
      });
    }

    if (isLoginPage) {
      return redirectTo(request, "/dashboard", pathPrefix, response);
    }
  } else if (isProtected) {
    return redirectTo(request, "/login", pathPrefix, response);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
