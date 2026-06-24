import { AppHeader } from "@/components/layout/app-header";
import type { ClientNavKey } from "@/components/layout/nav-config";

type ClientLayoutProps = {
  organization: string;
  displayName: string;
  email: string;
  active: ClientNavKey;
  children: React.ReactNode;
};

export function ClientLayout({
  organization,
  displayName,
  email,
  active,
  children,
}: ClientLayoutProps) {
  return (
    <div className="app-shell app-shell-client">
      <AppHeader
        surface="client"
        subtitle={organization}
        displayName={displayName}
        email={email}
        active={active}
      />
      <main className="app-main">{children}</main>
    </div>
  );
}
