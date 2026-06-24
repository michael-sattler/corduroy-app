import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminDashboardView } from "@/components/views/admin-dashboard-view";
import { requireStaffSession } from "@/lib/auth/session";

export default async function AdminPage() {
  const { displayName, role, user } = await requireStaffSession();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="overview"
    >
      <AdminDashboardView />
    </StaffAdminShell>
  );
}
