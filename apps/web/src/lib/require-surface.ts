import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getSurfaceFromHost, type Surface } from "@/lib/subdomain";

export type AppSurface = "client" | "staff";

const SURFACE_HEADER = "x-corduroy-surface";

export async function requireSurface(): Promise<AppSurface> {
  const headerStore = await headers();

  const fromMiddleware = headerStore.get(SURFACE_HEADER);
  if (fromMiddleware === "client" || fromMiddleware === "staff") {
    return fromMiddleware;
  }

  const host = headerStore.get("host") ?? "";
  const surface = getSurfaceFromHost(host);

  if (surface !== "client" && surface !== "staff") {
    notFound();
  }

  return surface;
}
