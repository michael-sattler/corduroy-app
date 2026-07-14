import type { Metadata } from "next";
import { ClientLayout, StaffLayout } from "@/components/layout";
import { ClientDashboardShell } from "@/components/views/client-dashboard-shell";
import { StaffDashboardView } from "@/components/views/staff-dashboard-view";
import { requireClientSession, requireStaffSession } from "@/lib/auth/session";
import { getMessagingContact } from "@/lib/messaging/messaging-contact";
import { requireSurface } from "@/lib/require-surface";
import {
  isStaffClientDetailTabKey,
  staffClientDetailTabTitle,
} from "@/lib/staff-client-detail-tabs";
import { fetchStaffDashboardClients } from "@/lib/staff-client-directory";

const CORDUROY_CONTACT_USER_ID = "54cc7c22-7263-4935-9357-5a288b7285ca";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const surface = await requireSurface();
  if (surface !== "staff") {
    return { title: "Dashboard" };
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

    const messagingContact = await getMessagingContact(CORDUROY_CONTACT_USER_ID);

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
        <ClientDashboardShell messagingContact={messagingContact} />
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
