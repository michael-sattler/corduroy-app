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

export function AppHeader({
  surface,
  subtitle,
  displayName,
  email,
  role,
  active,
}: AppHeaderProps) {
  const topbarClass =
    surface === "staff" ? "app-topbar app-topbar-staff" : "app-topbar";

  return (
    <header className={topbarClass}>
      <div className="container-fluid app-topbar-inner">
        <PageHead surface={surface} subtitle={subtitle} />
        {surface === "client" ? (
          <TopNav surface="client" active={active as ClientNavKey} />
        ) : (
          <TopNav surface="staff" active={active as StaffNavKey} />
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
