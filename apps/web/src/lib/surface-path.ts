import { headers } from "next/headers";
import {
  SURFACE_PATH_PREFIX_HEADER,
  withAppPath,
} from "@/lib/path-routing";

export async function getSurfacePathPrefix(): Promise<string> {
  const headerStore = await headers();
  return headerStore.get(SURFACE_PATH_PREFIX_HEADER) ?? "";
}

export async function resolveAppHref(path: string): Promise<string> {
  const prefix = await getSurfacePathPrefix();
  return withAppPath(path, prefix);
}
