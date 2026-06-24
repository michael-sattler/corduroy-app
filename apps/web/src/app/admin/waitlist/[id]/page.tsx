import { notFound } from "next/navigation";
import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminWaitlistDetailView } from "@/components/views/admin-waitlist-detail-view";
import { requireStaffSession } from "@/lib/auth/session";
import { getWaitlistEntry } from "@/lib/placeholder-admin-data";

type AdminWaitlistDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminWaitlistDetailPage({
  params,
}: AdminWaitlistDetailPageProps) {
  const { id } = await params;
  const entry = getWaitlistEntry(id);
  if (!entry) {
    notFound();
  }

  const { displayName, role, user } = await requireStaffSession();

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="waitlist"
    >
      <AdminWaitlistDetailView entry={entry} />
    </StaffAdminShell>
  );
}
