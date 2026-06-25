import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminPromptsView } from "@/components/views/admin-prompts-view";
import { requireStaffSession } from "@/lib/auth/session";
import { fetchPrompts } from "@/lib/admin-api";

export default async function AdminPromptsPage() {
  const { displayName, role, user } = await requireStaffSession();
  const { prompts } = await fetchPrompts();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="prompts"
    >
      <AdminPromptsView prompts={prompts} />
    </StaffAdminShell>
  );
}
