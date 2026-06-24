import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminPromptsView } from "@/components/views/admin-prompts-view";
import { requireStaffSession } from "@/lib/auth/session";

export default async function AdminPromptsPage() {
  const { displayName, role, user } = await requireStaffSession();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="prompts"
    >
      <AdminPromptsView />
    </StaffAdminShell>
  );
}
