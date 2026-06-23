import { NextRequest, NextResponse } from "next/server";
import { getSurfaceFromHost, surfaceBasePath } from "@/lib/subdomain";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";
  const surface = getSurfaceFromHost(host);
  const basePath = surfaceBasePath(surface);

  if (!basePath) {
    return NextResponse.next();
  }

  if (pathname.startsWith(basePath)) {
    return NextResponse.next();
  }

  const destination =
    pathname === "/" ? `${basePath}/dashboard` : `${basePath}${pathname}`;

  return NextResponse.rewrite(new URL(destination, request.url));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
