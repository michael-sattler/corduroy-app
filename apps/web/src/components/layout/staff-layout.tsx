import { AppHeader } from "@/components/layout/app-header";
import type { StaffNavKey } from "@/components/layout/nav-config";

type StaffLayoutProps = {
  displayName: string;
  email: string;
  role: string;
  active?: StaffNavKey;
  subtitle?: string;
  children: React.ReactNode;
};

export function StaffLayout({
  displayName,
  email,
  role,
  active = "portfolio",
  subtitle = "Staff Console",
  children,
}: StaffLayoutProps) {
  return (
    <div className="app-shell app-shell-staff">
      <AppHeader
        surface="staff"
        subtitle={subtitle}
        displayName={displayName}
        email={email}
        role={role}
        active={active}
      />
      <main className="app-main app-main-staff">{children}</main>
    </div>
  );
}
