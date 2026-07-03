import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminStaffView } from "@/components/views/admin-staff-view";
import { requireStaffSession } from "@/lib/auth/session";
import { fetchStaff } from "@/lib/admin-api";
import { enrichStaffForAdmin } from "@/lib/admin-directory";

export default async function AdminStaffPage() {
  const { displayName, role, user, avatarPath, avatarUpdatedAt } =
    await requireStaffSession();
  const { staff } = await fetchStaff();
  const enriched = await enrichStaffForAdmin(staff);

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      active="staff"
    >
      <AdminStaffView staff={enriched} />
    </StaffAdminShell>
  );
}
