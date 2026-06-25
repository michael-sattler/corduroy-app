import Image from "next/image";
import Link from "next/link";
import type { AppSurface } from "@/components/layout/nav-config";
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
};

export function PageHead({
  surface,
  subtitle,
  homeHref = "/dashboard",
}: PageHeadProps) {
  const subtitleClass =
    surface === "staff"
      ? "app-org-name text-white-50 text-truncate"
      : "app-org-name text-body-secondary text-truncate";

  const subtitlePrefix = surface === "client" ? "/ " : "";

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
      <span className={subtitleClass}>
        {subtitlePrefix}
        {subtitle}
      </span>
    </div>
  );
}
