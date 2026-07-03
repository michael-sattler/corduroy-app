import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminWaitlistView } from "@/components/views/admin-waitlist-view";
import { requireStaffSession } from "@/lib/auth/session";
import { fetchWaitlist } from "@/lib/admin-api";

export default async function AdminWaitlistPage() {
  const { displayName, role, user, avatarPath, avatarUpdatedAt } =
    await requireStaffSession();
  const { entries } = await fetchWaitlist();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      active="waitlist"
    >
      <AdminWaitlistView entries={entries} />
    </StaffAdminShell>
  );
}
