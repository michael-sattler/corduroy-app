import type { Metadata } from "next";
import { StaffAdminShell } from "@/components/layout/staff-admin-shell";
import { AdminMetricsView } from "@/components/views/admin-metrics-view";
import { fetchMetricClientOptions, fetchMetricDefinitions } from "@/lib/admin-api";
import { requireStaffSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Metric catalog | Corduroy",
};

export default async function AdminMetricsPage() {
  const { displayName, role, user, avatarPath, avatarUpdatedAt } =
    await requireStaffSession();
  const [{ metrics }, { clients }] = await Promise.all([
    fetchMetricDefinitions(),
    fetchMetricClientOptions(),
  ]);

  return (
    <StaffAdminShell
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      avatarPath={avatarPath}
      avatarVersion={avatarUpdatedAt}
      active="metrics"
    >
      <AdminMetricsView metrics={metrics} clients={clients} />
    </StaffAdminShell>
  );
}
