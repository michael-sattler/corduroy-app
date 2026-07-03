import "server-only";

import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";

export const PLATFORM_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export type PlatformImageKind = "client-logo" | "portal-avatar" | "staff-avatar";

export type SavedPlatformImage = {
  path: string;
  updatedAt: string;
};

function getPublicDir(): string {
  const candidates = [
    path.join(process.cwd(), "public"),
    path.join(process.cwd(), "apps/web/public"),
  ];

  for (const dir of candidates) {
    if (existsSync(path.join(dir, "brand"))) {
      return dir;
    }
  }

  return candidates[0];
}

function uploadsDir(): string {
  return path.join(getPublicDir(), "uploads");
}

function relativePath(kind: PlatformImageKind, id: string, ext: string): string {
  switch (kind) {
    case "client-logo":
      return `/uploads/logos/${id}.${ext}`;
    case "portal-avatar":
      return `/uploads/avatars/portal/${id}.${ext}`;
    case "staff-avatar":
      return `/uploads/avatars/staff/${id}.${ext}`;
  }
}

function absolutePathForRelative(relative: string): string {
  return path.join(getPublicDir(), relative.replace(/^\//, ""));
}

function subdirForKind(kind: PlatformImageKind): string {
  switch (kind) {
    case "client-logo":
      return "logos";
    case "portal-avatar":
      return path.join("avatars", "portal");
    case "staff-avatar":
      return path.join("avatars", "staff");
  }
}

export function extensionForImageFile(file: File): string {
  const fromMime = MIME_TO_EXT[file.type];
  if (fromMime) return fromMime;

  const match = file.name.match(/\.(jpe?g|png|webp|gif)$/i);
  if (match) {
    return match[1].toLowerCase().replace("jpeg", "jpg");
  }

  throw new Error("Unsupported image type. Use JPEG, PNG, WebP, or GIF.");
}

export function validateImageFile(file: File): void {
  if (!file.size) {
    throw new Error("Choose an image file to upload.");
  }

  if (file.size > PLATFORM_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 2 MB or smaller.");
  }

  extensionForImageFile(file);
}

async function removeSiblingImages(
  kind: PlatformImageKind,
  id: string,
  keepExt: string,
): Promise<void> {
  const dir = path.join(uploadsDir(), subdirForKind(kind));
  if (!existsSync(dir)) return;

  const prefix = `${id}.`;
  const entries = await readdir(dir);

  await Promise.all(
    entries
      .filter((name) => name.startsWith(prefix) && name !== `${id}.${keepExt}`)
      .map((name) => unlink(path.join(dir, name)).catch(() => undefined)),
  );
}

export async function savePlatformImage(
  kind: PlatformImageKind,
  id: string,
  file: File,
): Promise<SavedPlatformImage> {
  validateImageFile(file);
  const ext = extensionForImageFile(file);
  const relative = relativePath(kind, id, ext);
  const absolute = absolutePathForRelative(relative);
  const dir = path.dirname(absolute);

  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);
  await removeSiblingImages(kind, id, ext);

  return {
    path: relative,
    updatedAt: new Date().toISOString(),
  };
}

export function platformImageUrl(
  imagePath: string | null | undefined,
  updatedAt: string | null | undefined,
): string | null {
  if (!imagePath) return null;
  if (!updatedAt) return imagePath;
  const version = new Date(updatedAt).getTime();
  if (Number.isNaN(version)) return imagePath;
  return `${imagePath}?v=${version}`;
}
