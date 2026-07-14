"use client";

import { useEffect, useState, type ReactNode } from "react";
import type {
  ClientPlanDashboard,
  ClientPlanDashboardResponse,
} from "@/lib/plan/client-plan-dashboard-types";
import { PlanKpiWidgets } from "@/components/views/plan-kpi-widgets";

export function ClientDashboardView() {
  const [dashboard, setDashboard] = useState<ClientPlanDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/client/plan/dashboard", {
          cache: "no-store",
        });
        const body = (await res.json()) as ClientPlanDashboardResponse & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(body.error ?? "Could not load your dashboard");
        }

        if (!cancelled) {
          setDashboard(body.plan);
        }
      } catch (err) {
        if (!cancelled) {
          setDashboard(null);
          setError(
            err instanceof Error ? err.message : "Could not load your dashboard",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="container-fluid py-3 client-dashboard-view">
        <div className="app-card p-3 text-body-secondary">
          Loading your dashboard…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-3 client-dashboard-view">
        <div className="app-card p-3 text-danger">{error}</div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="container-fluid py-3 client-dashboard-view">
        <div className="app-card p-3 text-body-secondary">
          Your plan isn&apos;t set up yet. Check back soon.
        </div>
      </div>
    );
  }

  const initiativesComplete = dashboard.initiatives.filter(
    (i) => i.progress_pct >= 100 || i.status === "done",
  ).length;

  return (
    <div className="container-fluid py-3 client-dashboard-view">
      <div className="d-flex flex-column gap-3">
        {dashboard.kpis.length > 0 ? (
          <CollapsibleCard
            title={<div className="plan-sidebar-label">Key metrics</div>}
          >
            <PlanKpiWidgets kpis={dashboard.kpis} />
          </CollapsibleCard>
        ) : null}

        <div className="row g-3">
          <div className="plan-goals-card col-12 col-md-6">
            <CollapsibleCard
              title={<div className="plan-sidebar-label">Goals</div>}
            >
              <div className="d-flex flex-column gap-2">
                {dashboard.goals.map((goal) => (
                  <div key={goal.goal_id} className="small">
                    <div className="fw-medium">{goal.label}</div>
                    <div className="text-body-secondary">{goal.description}</div>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          </div>
          <div className="plan-initiatives-card col-12 col-md-6">
            <CollapsibleCard
              title={
                <div className="plan-sidebar-label">Initiative progress</div>
              }
            >
              <div className="small text-body-secondary mb-2">
                {initiativesComplete} of {dashboard.initiatives.length} complete
              </div>
              <div className="d-flex flex-column gap-2">
                {dashboard.initiatives.map((initiative) => (
                  <div key={initiative.initiative_id}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{initiative.label}</span>
                      <span className="text-body-secondary">
                        {initiative.progress_pct >= 100
                          ? "Done"
                          : `${initiative.progress_pct}%`}
                      </span>
                    </div>
                    <div className="progress plan-milestone-bar">
                      <div
                        className={`progress-bar bg-${
                          initiative.progress_pct >= 100
                            ? "success"
                            : initiative.status === "blocked"
                              ? "danger"
                              : initiative.progress_pct > 0
                                ? "primary"
                                : "secondary"
                        }`}
                        style={{ width: `${initiative.progress_pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function CollapsibleCard({
  title,
  children,
  defaultOpen = true,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="plan-key-metrics app-card">
      <div className="d-flex justify-content-between align-items-start gap-2">
        <div className="flex-grow-1 min-w-0">{title}</div>
        <button
          type="button"
          className="plan-collapse-toggle"
          onClick={() => setOpen((prev) => !prev)}
          aria-expanded={open}
          aria-label={open ? "Collapse section" : "Expand section"}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            aria-hidden="true"
            style={{
              transform: open ? "rotate(0deg)" : "rotate(-90deg)",
              transition: "transform 0.15s ease",
            }}
          >
            <path
              d="M4 6l4 4 4-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {open ? <div className="plan-collapse-body">{children}</div> : null}
    </div>
  );
}
