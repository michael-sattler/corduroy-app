import Image from "next/image";
import Link from "next/link";
import type { AppSurface } from "@/components/layout/nav-config";
import { withImageCacheBuster } from "@/lib/platform-images-client";
import logoClient from "../../../public/brand/logo-horiz-blue.png";
import logoStaff from "../../../public/brand/logo-horiz-white.png";

const logos: Record<AppSurface, typeof logoClient> = {
  client: logoClient,
  staff: logoStaff,
};

type PageHeadProps = {
  surface: AppSurface;
  /** Client: organization name. Staff: e.g. "Consultant admin". */
  subtitle: string;
  homeHref?: string;
  orgLogoPath?: string | null;
  orgLogoVersion?: string | null;
};

export function PageHead({
  surface,
  subtitle,
  homeHref = "/dashboard",
  orgLogoPath = null,
  orgLogoVersion = null,
}: PageHeadProps) {
  const subtitleClass =
    surface === "staff"
      ? "app-org-name text-white-50 text-truncate"
      : "app-org-name text-body-secondary text-truncate";

  const orgLogoSrc =
    surface === "client" ? withImageCacheBuster(orgLogoPath, orgLogoVersion) : null;

  return (
    <div className="d-flex align-items-center gap-3 min-w-0">
      <Link
        href={homeHref}
        className="app-brand-lockup shrink-0"
        prefetch={false}
      >
        <Image
          src={logos[surface]}
          alt="Corduroy"
          className="app-brand-logo"
          priority
        />
      </Link>
      <span className="d-flex align-items-center gap-2 min-w-0">
        {orgLogoSrc ? (
          <span className="app-org-avatar" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={orgLogoSrc} alt="" />
          </span>
        ) : null}
        <span className={subtitleClass}>{subtitle}</span>
      </span>
    </div>
  );
}
