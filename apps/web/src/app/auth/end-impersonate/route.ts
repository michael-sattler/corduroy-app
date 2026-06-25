import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import {
  masqueradeCookieName,
  parseMasqueradeSession,
} from "@/lib/impersonation";
import { requirePublicSupabaseConfig } from "@/lib/supabase/env";
import { getSurfaceDashboardLinks } from "@/lib/surface-urls";
import { getRequestHostFromHeaders } from "@/lib/request-host";

export async function GET(request: NextRequest) {
  const masquerade = parseMasqueradeSession(
    request.cookies.get(masqueradeCookieName())?.value,
  );

  const host = getRequestHostFromHeaders(request.headers);
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const links = getSurfaceDashboardLinks(host, proto);
  const fallbackReturn = links.staff.href.replace(/\/dashboard$/, "/admin");

  let response = NextResponse.redirect(masquerade?.staffReturnUrl ?? fallbackReturn);

  const config = requirePublicSupabaseConfig();
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

  await supabase.auth.signOut();
  response.cookies.set(masqueradeCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
