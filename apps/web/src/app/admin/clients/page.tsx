import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminClientsView } from "@/components/views/admin-clients-view";
import { requireStaffSession } from "@/lib/auth/session";
import { fetchClients } from "@/lib/admin-api";
import { getSurfacePathPrefix } from "@/lib/surface-path";

export default async function AdminClientsPage() {
  const { displayName, role, user } = await requireStaffSession();
  const pathPrefix = await getSurfacePathPrefix();
  const { clients } = await fetchClients();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="clients"
    >
      <AdminClientsView clients={clients} pathPrefix={pathPrefix} />
    </StaffAdminShell>
  );
}
