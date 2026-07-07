import "server-only";

import { constants, existsSync } from "node:fs";
import { access, mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const PLATFORM_IMAGE_MAX_BYTES = 2 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const IMAGE_EXTENSIONS = ["jpg", "png", "webp", "gif"] as const;

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

function storageObjectPath(kind: PlatformImageKind, id: string, ext: string): string {
  const subdir = subdirForKind(kind).replace(/\\/g, "/");
  return `${subdir}/${id}.${ext}`;
}

function shouldUseSupabaseStorage(): boolean {
  if (process.env.PLATFORM_IMAGES_USE_SUPABASE === "1") {
    return true;
  }

  return Boolean(process.env.VERCEL);
}

async function canWriteLocalUploads(): Promise<boolean> {
  if (shouldUseSupabaseStorage()) {
    return false;
  }

  const dir = uploadsDir();

  try {
    await mkdir(dir, { recursive: true });
    await access(dir, constants.W_OK);
    return true;
  } catch {
    return false;
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

async function removeSiblingImagesLocal(
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

async function removeSiblingImagesRemote(
  kind: PlatformImageKind,
  id: string,
  keepExt: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  const subdir = subdirForKind(kind).replace(/\\/g, "/");
  const removePaths = IMAGE_EXTENSIONS.filter((ext) => ext !== keepExt).map(
    (ext) => `${subdir}/${id}.${ext}`,
  );

  if (removePaths.length === 0) {
    return;
  }

  await admin.storage.from("platform-images").remove(removePaths);
}

async function savePlatformImageLocal(
  kind: PlatformImageKind,
  id: string,
  file: File,
  ext: string,
): Promise<SavedPlatformImage> {
  const relative = relativePath(kind, id, ext);
  const absolute = absolutePathForRelative(relative);
  const dir = path.dirname(absolute);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(absolute, buffer);
  } catch (error) {
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : "";

    if (code === "EACCES" || code === "EROFS") {
      throw new Error(
        "Image uploads are not writable on this host. Use Supabase Storage (set PLATFORM_IMAGES_USE_SUPABASE=1) or run the web app with a writable public/uploads directory.",
      );
    }

    throw error;
  }

  await removeSiblingImagesLocal(kind, id, ext);

  return {
    path: relative,
    updatedAt: new Date().toISOString(),
  };
}

async function savePlatformImageRemote(
  kind: PlatformImageKind,
  id: string,
  file: File,
  ext: string,
): Promise<SavedPlatformImage> {
  const admin = createServiceRoleClient();
  const objectPath = storageObjectPath(kind, id, ext);
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType =
    file.type || (ext === "jpg" ? "image/jpeg" : `image/${ext}`);

  await removeSiblingImagesRemote(kind, id, ext);

  const { error } = await admin.storage.from("platform-images").upload(objectPath, buffer, {
    contentType,
    upsert: true,
  });

  if (error) {
    if (
      error.message.includes("Bucket not found") ||
      error.message.includes("platform-images")
    ) {
      throw new Error(
        "Platform image storage is not configured. Run migration 20260707024500_platform_images_storage.sql in Supabase.",
      );
    }

    throw new Error(error.message);
  }

  const { data } = admin.storage.from("platform-images").getPublicUrl(objectPath);

  return {
    path: data.publicUrl,
    updatedAt: new Date().toISOString(),
  };
}

export async function savePlatformImage(
  kind: PlatformImageKind,
  id: string,
  file: File,
): Promise<SavedPlatformImage> {
  validateImageFile(file);
  const ext = extensionForImageFile(file);

  if (await canWriteLocalUploads()) {
    return savePlatformImageLocal(kind, id, file, ext);
  }

  return savePlatformImageRemote(kind, id, file, ext);
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
