import type { Metadata } from "next";
import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminDashboardView } from "@/components/views/admin-dashboard-view";
import { requireStaffSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Staff | Corduroy",
};

export default async function AdminPage() {
  const { displayName, role, user, avatarPath, avatarUpdatedAt } =
    await requireStaffSession();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      active="overview"
    >
      <AdminDashboardView />
    </StaffAdminShell>
  );
}
