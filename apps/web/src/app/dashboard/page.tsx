import type { Metadata } from "next";
import Link from "next/link";
import { ClientLayout, StaffLayout } from "@/components/layout";
import { ClientMessagingPanel } from "@/components/messaging/client-messaging-panel";
import { StaffDashboardView } from "@/components/views/staff-dashboard-view";
import { requireClientSession, requireStaffSession } from "@/lib/auth/session";
import { requireSurface } from "@/lib/require-surface";
import {
  isStaffClientDetailTabKey,
  staffClientDetailTabTitle,
} from "@/lib/staff-client-detail-tabs";
import {
  fetchStaffDashboardClients,
} from "@/lib/staff-client-directory";
import { resolveAppHref } from "@/lib/surface-path";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const surface = await requireSurface();
  if (surface !== "staff") {
    return {};
  }

  const { tab } = await searchParams;
  const activeTab =
    tab && isStaffClientDetailTabKey(tab) ? tab : "dashboard";

  return { title: staffClientDetailTabTitle(activeTab) };
}

export default async function DashboardPage() {
  const surface = await requireSurface();

  if (surface === "client") {
    const {
      organization,
      displayName,
      user,
      avatarPath,
      avatarUpdatedAt,
      organizationLogoPath,
      organizationLogoUpdatedAt,
    } = await requireClientSession();
    const vaultHref = await resolveAppHref("/vault", "client");
    const planHref = await resolveAppHref("/plan", "client");

    return (
      <ClientLayout
        organization={organization}
        displayName={displayName}
        email={user.email ?? ""}
        avatarPath={avatarPath}
        avatarVersion={avatarUpdatedAt}
        orgLogoPath={organizationLogoPath}
        orgLogoVersion={organizationLogoUpdatedAt}
        active="dashboard"
      >
        <div className="container-fluid py-4">
          <div className="app-card">
            <h2 className="h4 mb-2">Welcome, {displayName}</h2>
            <p className="text-body-secondary mb-4">{organization}</p>
            <p className="mb-4">
              Your KPI dashboard and coaching insights will live here. For now,
              explore your data sources and weekly plan.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link href={vaultHref} className="btn btn-primary">
                Vault
              </Link>
              <Link href={planHref} className="btn btn-outline-primary">
                90-day plan
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <ClientMessagingPanel />
          </div>
        </div>
      </ClientLayout>
    );
  }

  const { displayName, role, user, avatarPath, avatarUpdatedAt } =
    await requireStaffSession();
  const clients = await fetchStaffDashboardClients();

  return (
    <StaffLayout
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      active="portfolio"
    >
      <StaffDashboardView displayName={displayName} clients={clients} />
    </StaffLayout>
  );
}
