import { AppHeader } from "@/components/layout/app-header";
import type { StaffNavKey } from "@/components/layout/nav-config";

type StaffLayoutProps = {
  active?: StaffNavKey;
  subtitle?: string;
  children: React.ReactNode;
} & (
  | {
      guest: true;
      displayName?: never;
      email?: never;
      role?: never;
    }
  | {
      guest?: false;
      displayName: string;
      email: string;
      role: string;
      avatarPath?: string | null;
      avatarVersion?: string | null;
    }
);

export function StaffLayout(props: StaffLayoutProps) {
  const {
    active = "portfolio",
    subtitle = "Staff Console",
    children,
  } = props;
  const guest = props.guest === true;
  const displayName = guest ? "" : props.displayName;
  const email = guest ? "" : props.email;
  const role = guest ? "" : props.role;
  const avatarPath = guest ? null : (props.avatarPath ?? null);
  const avatarVersion = guest ? null : (props.avatarVersion ?? null);

  return (
    <div className="app-shell app-shell-staff">
      <AppHeader
        surface="staff"
        subtitle={subtitle}
        displayName={displayName}
        email={email}
        role={role}
        avatarPath={avatarPath}
        avatarVersion={avatarVersion}
        active={active}
        guest={guest}
      />
      <main className={`app-main app-main-staff${guest ? " app-main-guest" : ""}`}>
        {children}
      </main>
    </div>
  );
}
