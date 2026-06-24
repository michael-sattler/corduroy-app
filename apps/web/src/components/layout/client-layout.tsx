import { AppHeader } from "@/components/layout/app-header";
import type { ClientNavKey } from "@/components/layout/nav-config";

type ClientLayoutProps = {
  active?: ClientNavKey;
  children: React.ReactNode;
} & (
  | {
      guest: true;
      organization?: string;
      displayName?: never;
      email?: never;
    }
  | {
      guest?: false;
      organization: string;
      displayName: string;
      email: string;
    }
);

export function ClientLayout(props: ClientLayoutProps) {
  const { active = "dashboard", children } = props;
  const guest = props.guest === true;
  const organization = guest
    ? (props.organization ?? "Client portal")
    : props.organization;
  const displayName = guest ? "" : props.displayName;
  const email = guest ? "" : props.email;

  return (
    <div className="app-shell app-shell-client">
      <AppHeader
        surface="client"
        subtitle={organization}
        displayName={displayName}
        email={email}
        active={active}
        guest={guest}
      />
      <main className={`app-main${guest ? " app-main-guest" : ""}`}>{children}</main>
    </div>
  );
}
