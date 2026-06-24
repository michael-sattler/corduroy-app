import Link from "next/link";
import { adminActivityStats, adminHealthChecks } from "@/lib/placeholder-admin-data";

export function AdminDashboardView() {
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

      <section className="app-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h6 mb-0">Health check</h2>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
            Run checks
          </button>
        </div>
        <div className="d-flex flex-column gap-2">
          {adminHealthChecks.map((check) => (
            <div key={check.service} className="admin-health-row">
              <span
                className={`admin-health-dot ${check.status}`}
                aria-hidden
              />
              <div className="flex-grow-1">
                <div className="fw-medium">{check.service}</div>
                <div className="small text-body-secondary">{check.detail}</div>
              </div>
              <span className="small text-body-secondary">{check.checkedAt}</span>
              <span className={`badge admin-health-badge ${check.status}`}>
                {check.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="app-card">
        <h2 className="h6 mb-3">Tools</h2>
        <div className="row g-3">
          <div className="col-md-6">
            <Link href="/admin/prompts" className="admin-tool-card">
              <div className="fw-semibold">Prompt library</div>
              <p className="small text-body-secondary mb-0">
                Edit system prompts stored in the database for plan generation,
                coaching, and vault extraction.
              </p>
            </Link>
          </div>
          <div className="col-md-6">
            <Link href="/admin/waitlist" className="admin-tool-card">
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
