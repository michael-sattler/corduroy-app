import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminWaitlistView } from "@/components/views/admin-waitlist-view";
import { requireStaffSession } from "@/lib/auth/session";
import { fetchWaitlist } from "@/lib/admin-api";

export default async function AdminWaitlistPage() {
  const { displayName, role, user } = await requireStaffSession();
  const { entries } = await fetchWaitlist();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="waitlist"
    >
      <AdminWaitlistView entries={entries} />
    </StaffAdminShell>
  );
}
