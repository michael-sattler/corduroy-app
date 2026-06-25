import { AppHeader } from "@/components/layout/app-header";
import { MasqueradeBanner } from "@/components/layout/masquerade-banner";
import type { ClientNavKey } from "@/components/layout/nav-config";
import { buildEndMasqueradePath, readMasqueradeSession } from "@/lib/masquerade";

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

export async function ClientLayout(props: ClientLayoutProps) {
  const { active = "dashboard", children } = props;
  const guest = props.guest === true;
  const organization = guest
    ? (props.organization ?? "Client portal")
    : props.organization;
  const displayName = guest ? "" : props.displayName;
  const email = guest ? "" : props.email;
  const masquerade = guest ? null : await readMasqueradeSession();
  const endMasqueradeHref = masquerade ? await buildEndMasqueradePath() : null;

  return (
    <div className="app-shell app-shell-client">
      {masquerade && endMasqueradeHref ? (
        <MasqueradeBanner session={masquerade} endHref={endMasqueradeHref} />
      ) : null}
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
