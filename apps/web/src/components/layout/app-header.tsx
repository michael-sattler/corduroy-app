import { getSurfacePathPrefix } from "@/lib/surface-path";
import { withAppPath } from "@/lib/path-routing";
import { AccessBrokerStatusIndicator } from "@/components/layout/access-broker-status-indicator";
import { LoggedInUser } from "@/components/layout/logged-in-user";
import type {
  AppSurface,
  ClientNavKey,
  StaffNavKey,
} from "@/components/layout/nav-config";
import { PageHead } from "@/components/layout/page-head";
import { TopNav } from "@/components/layout/top-nav";

type AppHeaderProps = {
  surface: AppSurface;
  subtitle: string;
  displayName: string;
  email?: string;
  role?: string;
  avatarPath?: string | null;
  avatarVersion?: string | null;
  orgLogoPath?: string | null;
  orgLogoVersion?: string | null;
  active: ClientNavKey | StaffNavKey;
  guest?: boolean;
};

export async function AppHeader({
  surface,
  subtitle,
  displayName,
  email,
  role,
  avatarPath,
  avatarVersion,
  orgLogoPath = null,
  orgLogoVersion = null,
  active,
  guest = false,
}: AppHeaderProps) {
  const pathPrefix = await getSurfacePathPrefix();
  const topbarClass =
    surface === "staff" ? "app-topbar app-topbar-staff" : "app-topbar";

  return (
    <header className={topbarClass}>
      <div className="container-fluid app-topbar-inner">
        <PageHead
          surface={surface}
          subtitle={subtitle}
          orgLogoPath={orgLogoPath}
          orgLogoVersion={orgLogoVersion}
          homeHref={withAppPath(
            surface === "client" ? "/plan" : "/dashboard",
            pathPrefix,
          )}
        />
        {guest ? null : surface === "client" ? (
          <TopNav surface="client" active={active as ClientNavKey} pathPrefix={pathPrefix} />
        ) : (
          <TopNav surface="staff" active={active as StaffNavKey} pathPrefix={pathPrefix} />
        )}
        {guest ? null : (
          <div className="app-topbar-trailing">
            {surface === "staff" ? <AccessBrokerStatusIndicator /> : null}
            <LoggedInUser
              surface={surface}
              displayName={displayName}
              email={email}
              role={role}
              avatarPath={avatarPath}
              avatarVersion={avatarVersion}
            />
          </div>
        )}
      </div>
    </header>
  );
}
