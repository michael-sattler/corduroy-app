import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { requirePublicSupabaseConfig } from "@/lib/supabase/env";
import {
  masqueradeCookieName,
  serializeMasqueradeSession,
  verifyImpersonationToken,
} from "@/lib/impersonation";
import {
  isPathBasedHost,
  parsePathBasedRoute,
  pathPrefixForSurface,
  withAppPath,
} from "@/lib/path-routing";
import { getRequestHostFromHeaders } from "@/lib/request-host";
import { getSurfaceDashboardLinks } from "@/lib/surface-urls";
import { getSurfaceFromHost } from "@/lib/subdomain";

function dashboardRedirectUrl(request: NextRequest): URL {
  const host = getRequestHostFromHeaders(request.headers);
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (request.nextUrl.protocol === "https:" ? "https" : "http");
  const pathname = request.nextUrl.pathname;

  if (isPathBasedHost(host)) {
    const parsed = parsePathBasedRoute(pathname);
    const prefix = parsed?.prefix ?? pathPrefixForSurface("client");
    return new URL(withAppPath("/dashboard", prefix), `${proto}://${host}`);
  }

  const links = getSurfaceDashboardLinks(host, proto);

  if (getSurfaceFromHost(host) === "client") {
    const clientOrigin = links.client.href.replace(/\/dashboard$/, "");
    return new URL("/dashboard", clientOrigin);
  }

  return new URL(links.client.href);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = verifyImpersonationToken(token);
  if (!payload) {
    return NextResponse.redirect(
      new URL("/login?error=impersonation_expired", request.url),
    );
  }

  const admin = createServiceRoleClient();
  const { data: profile, error: profileError } = await admin
    .from("client_users")
    .select("user_id, display_name, client_id")
    .eq("id", payload.clientUserId)
    .maybeSingle();

  if (profileError || !profile || profile.client_id !== payload.clientId) {
    return NextResponse.redirect(
      new URL("/login?error=impersonation_invalid", request.url),
    );
  }

  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(
    profile.user_id,
  );

  const email = authUser.user?.email;
  if (authError || !email) {
    return NextResponse.redirect(
      new URL("/login?error=impersonation_invalid", request.url),
    );
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData.properties.hashed_token) {
    return NextResponse.redirect(
      new URL("/login?error=impersonation_failed", request.url),
    );
  }

  const { data: sessionData, error: sessionError } = await admin.auth.verifyOtp({
    type: "email",
    token_hash: linkData.properties.hashed_token,
  });

  if (sessionError || !sessionData.session) {
    return NextResponse.redirect(
      new URL("/login?error=impersonation_failed", request.url),
    );
  }

  const config = requirePublicSupabaseConfig();
  let response = NextResponse.redirect(dashboardRedirectUrl(request));

  const supabase = createServerClient(config.url, config.anonKey, {
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
  });

  const { error: setSessionError } = await supabase.auth.setSession({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
  });

  if (setSessionError) {
    return NextResponse.redirect(
      new URL("/login?error=impersonation_failed", request.url),
    );
  }

  response.cookies.set(
    masqueradeCookieName(),
    serializeMasqueradeSession({
      clientDisplayName: profile.display_name,
      clientEmail: email,
      staffDisplayName: payload.staffDisplayName,
      staffReturnUrl: payload.staffReturnUrl,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    },
  );

  return response;
}
