import { getSurfacePathPrefix } from "@/lib/surface-path";
import { withAppPath } from "@/lib/path-routing";
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
  active: ClientNavKey | StaffNavKey;
};

export async function AppHeader({
  surface,
  subtitle,
  displayName,
  email,
  role,
  active,
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
          homeHref={withAppPath("/dashboard", pathPrefix)}
        />
        {surface === "client" ? (
          <TopNav surface="client" active={active as ClientNavKey} pathPrefix={pathPrefix} />
        ) : (
          <TopNav surface="staff" active={active as StaffNavKey} pathPrefix={pathPrefix} />
        )}
        <LoggedInUser
          surface={surface}
          displayName={displayName}
          email={email}
          role={role}
        />
      </div>
    </header>
  );
}
