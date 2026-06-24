import Link from "next/link";
import { ClientLayout, StaffLayout } from "@/components/layout";
import { StaffDashboardView } from "@/components/views/staff-dashboard-view";
import { requireClientSession, requireStaffSession } from "@/lib/auth/session";
import { requireSurface } from "@/lib/require-surface";
import { resolveAppHref } from "@/lib/surface-path";

export default async function DashboardPage() {
  const surface = await requireSurface();

  if (surface === "client") {
    const { organization, displayName, user } = await requireClientSession();
    const vaultHref = await resolveAppHref("/vault");
    const planHref = await resolveAppHref("/plan");

    return (
      <ClientLayout
        organization={organization}
        displayName={displayName}
        email={user.email ?? ""}
        active="dashboard"
      >
        <div className="container-fluid py-4">
          <div className="app-card">
            <h2 className="h4 mb-2">Welcome, {displayName}</h2>
            <p className="text-body-secondary mb-4">{organization}</p>
            <p className="mb-4">
              Your KPI dashboard and coaching insights will live here. For now,
              explore your data sources and weekly plan.
            </p>
            <div className="d-flex flex-wrap gap-3">
              <Link href={vaultHref} className="btn btn-primary">
                Data hub
              </Link>
              <Link href={planHref} className="btn btn-outline-primary">
                90-day plan
              </Link>
            </div>
          </div>
        </div>
      </ClientLayout>
    );
  }

  const { displayName, role, user } = await requireStaffSession();

  return (
    <StaffLayout
      displayName={displayName}
      email={user.email ?? ""}
      role={role}
      active="portfolio"
    >
      <StaffDashboardView displayName={displayName} />
    </StaffLayout>
  );
}
