import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminWaitlistView } from "@/components/views/admin-waitlist-view";
import { requireStaffSession } from "@/lib/auth/session";

export default async function AdminWaitlistPage() {
  const { displayName, role, user } = await requireStaffSession();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="waitlist"
    >
      <AdminWaitlistView />
    </StaffAdminShell>
  );
}
