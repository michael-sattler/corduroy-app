import Link from "next/link";
import { AdminHealthSection } from "@/components/views/admin-health-section";
import { getStaffAccessToken } from "@/lib/admin-api";
import { runAdminHealthChecks } from "@/lib/admin-health-checks";
import type { HealthCheck } from "@/lib/admin-api-types";
import { adminActivityStats } from "@/lib/placeholder-admin-data";
import { requirePublicSupabaseConfig } from "@/lib/supabase/env";
import { withAppPath } from "@/lib/path-routing";
import { getSurfacePathPrefix } from "@/lib/surface-path";

export async function AdminDashboardView() {
  const pathPrefix = await getSurfacePathPrefix();

  let initialChecks: HealthCheck[] = [];
  let healthError: string | null = null;

  try {
    const token = await getStaffAccessToken();
    const { url, anonKey } = requirePublicSupabaseConfig();
    initialChecks = await runAdminHealthChecks(token, url, anonKey);
  } catch (error) {
    healthError =
      error instanceof Error ? error.message : "Could not load health checks";
  }

  return (
    <div className="d-flex flex-column gap-4">
      <div>
        <h1 className="h4 mb-1">Admin overview</h1>
        <p className="text-body-secondary mb-0">
          Platform-wide activity and infrastructure health. Not scoped to a single
          client.
        </p>
      </div>

      <section className="app-card">
        <h2 className="h6 mb-3">Recent activity</h2>
        <div className="row g-3">
          {adminActivityStats.map((stat) => (
            <div key={stat.label} className="col-md-6 col-xl-4">
              <div className="admin-stat-card">
                <div className="small text-body-secondary">{stat.label}</div>
                <div className="admin-stat-value">{stat.value}</div>
                <div className="small text-body-secondary">{stat.trend} vs prior week</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <AdminHealthSection
        initialChecks={initialChecks}
        initialError={healthError}
      />

      <section className="app-card">
        <h2 className="h6 mb-3">Tools</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <Link href={withAppPath("/admin/clients", pathPrefix)} className="admin-tool-card">
              <div className="fw-semibold">Clients</div>
              <p className="small text-body-secondary mb-0">
                Browse client organizations and portal users.
              </p>
            </Link>
          </div>
          <div className="col-md-6">
            <Link href={withAppPath("/admin/staff", pathPrefix)} className="admin-tool-card">
              <div className="fw-semibold">Staff</div>
              <p className="small text-body-secondary mb-0">
                View Corduroy team accounts and approval status.
              </p>
            </Link>
          </div>
          <div className="col-md-6">
            <Link href={withAppPath("/admin/prompts", pathPrefix)} className="admin-tool-card">
              <div className="fw-semibold">Prompt library</div>
              <p className="small text-body-secondary mb-0">
                Edit system prompts stored in the database for plan generation,
                coaching, and vault extraction.
              </p>
            </Link>
          </div>
          <div className="col-md-6">
            <Link href={withAppPath("/admin/waitlist", pathPrefix)} className="admin-tool-card">
              <div className="fw-semibold">Wait list</div>
              <p className="small text-body-secondary mb-0">
                Review consultation requests from the main marketing site.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
