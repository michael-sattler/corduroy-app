import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { readUserRole, roleForSurface } from "@/lib/auth/roles";
import { getSurfaceFromHost } from "@/lib/subdomain";

function nextWithSurface(request: NextRequest, surface: "client" | "staff") {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-corduroy-surface", surface);
  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

function copyCookies(from: NextResponse, to: NextResponse) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });
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
  const surface = getSurfaceFromHost(host);

  if (surface !== "client" && surface !== "staff") {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isLoginPage = pathname === "/login";
  const isProtected = isProtectedPath(pathname, surface);

  if (!isLoginPage && !isProtected) {
    return nextWithSurface(request, surface);
  }

  let response = nextWithSurface(request, surface);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const expectedRole = roleForSurface(surface);

  if (user) {
    const role = readUserRole(user.app_metadata);

    if (role !== expectedRole && !isLoginPage) {
      await supabase.auth.signOut();
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("error", "wrong_surface");
      const redirectResponse = NextResponse.redirect(loginUrl);
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }

    if (isLoginPage) {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      const redirectResponse = NextResponse.redirect(dashboardUrl);
      copyCookies(response, redirectResponse);
      return redirectResponse;
    }
  } else if (isProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    const redirectResponse = NextResponse.redirect(loginUrl);
    copyCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
