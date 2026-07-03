"use client";

import { withImageCacheBuster } from "@/lib/platform-images-client";

type MenuAvatarProps = {
  displayName: string;
  avatarPath: string | null;
  avatarVersion: string | null;
  cacheBuster?: number | null;
  className: string;
};

export function MenuAvatar({
  displayName,
  avatarPath,
  avatarVersion,
  cacheBuster = null,
  className,
}: MenuAvatarProps) {
  const src =
    cacheBuster !== null && avatarPath
      ? `${avatarPath}?v=${cacheBuster}`
      : withImageCacheBuster(avatarPath, avatarVersion);

  if (src) {
    return (
      <span className={className} aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
      </span>
    );
  }

  return (
    <span className={className} aria-hidden>
      {displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}
