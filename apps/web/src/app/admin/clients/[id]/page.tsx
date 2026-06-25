import { notFound } from "next/navigation";
import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminClientDetailView } from "@/components/views/admin-client-detail-view";
import { requireStaffSession } from "@/lib/auth/session";
import { fetchClient, fetchClientUsers } from "@/lib/admin-api";
import { enrichPortalUsersForAdmin } from "@/lib/admin-directory";
import { getSurfacePathPrefix } from "@/lib/surface-path";

type AdminClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminClientDetailPage({
  params,
}: AdminClientDetailPageProps) {
  const { id } = await params;
  const pathPrefix = await getSurfacePathPrefix();

  let client;
  let users;
  try {
    [{ client }, { users }] = await Promise.all([
      fetchClient(id),
      fetchClientUsers(id),
    ]);
  } catch {
    notFound();
  }

  const enrichedUsers = await enrichPortalUsersForAdmin(users);

  const { displayName, role, user } = await requireStaffSession();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="clients"
    >
      <AdminClientDetailView
        client={client}
        users={enrichedUsers}
        pathPrefix={pathPrefix}
      />
    </StaffAdminShell>
  );
}
