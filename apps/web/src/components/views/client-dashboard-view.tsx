"use client";

import { useEffect, useState, type ReactNode } from "react";
import type {
  ClientPlanDashboard,
  ClientPlanDashboardResponse,
  ClientPlanInitiative,
} from "@/lib/plan/client-plan-dashboard-types";
import { planStatusTone } from "@/lib/plan/staff-plan-dashboard-format";
import { PlanKpiWidgets } from "@/components/views/plan-kpi-widgets";
import type { DashboardWidgetView } from "@/lib/widgets";

function progressBarTone(initiative: ClientPlanInitiative): string {
  if (initiative.progress_pct >= 100 || initiative.status === "done") {
    return "success";
  }
  if (initiative.status === "blocked") {
    return "danger";
  }
  if (initiative.progress_pct > 0 || initiative.status === "in_progress") {
    return "info";
  }
  return "muted";
}

/** Priority 1 (highest) is fullest; higher ranks fade out. */
function priorityCircleOpacity(priority: number): number {
  const rank = Math.max(1, Math.round(priority));
  return Math.max(0.28, Math.min(1, 1.05 - (rank - 1) * 0.18));
}

export function ClientDashboardView() {
  const [dashboard, setDashboard] = useState<ClientPlanDashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidgetView[]>([]);
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
          setWidgets(body.widgets ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setDashboard(null);
          setWidgets([]);
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

  if (!dashboard && widgets.length === 0) {
    return (
      <div className="container-fluid py-3 client-dashboard-view">
        <div className="app-card p-3 text-body-secondary">
          Your plan isn&apos;t set up yet. Check back soon.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid py-3 client-dashboard-view">
      <div className="d-flex flex-column gap-3">
        {widgets.length > 0 ? (
          <CollapsibleCard
            title={<div className="plan-sidebar-label">Key metrics</div>}
          >
            <PlanKpiWidgets widgets={widgets} />
          </CollapsibleCard>
        ) : null}

        {!dashboard ? (
          <div className="app-card p-3 text-body-secondary">
            Your plan isn&apos;t set up yet. Check back soon.
          </div>
        ) : (
          <div className="row g-3">
            <div className="plan-goals-card col-12 col-md-6">
              <CollapsibleCard
                title={<div className="plan-sidebar-label">Goals</div>}
              >
                <div className="staff-stack-tight">
                  {dashboard.goals.map((goal) => (
                    <div key={goal.goal_id} className="staff-goal-row">
                      <div className="staff-goal-body min-w-0">
                        <div className="staff-goal-label">{goal.label}</div>
                        {goal.description ? (
                          <div className="staff-goal-meta">
                            {goal.description}
                          </div>
                        ) : null}
                        {goal.target ? (
                          <div className="staff-goal-meta">{goal.target}</div>
                        ) : null}
                      </div>
                      <span
                        className="staff-goal-priority-dot"
                        style={{
                          opacity: priorityCircleOpacity(goal.priority),
                        }}
                        title={`Priority ${goal.priority}`}
                        aria-label={`Priority ${goal.priority}`}
                      />
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
                <div className="staff-stack-tight">
                  {dashboard.initiatives.map((initiative) => {
                    const tone = planStatusTone(initiative.status);
                    const barTone = progressBarTone(initiative);

                    return (
                      <div
                        key={initiative.initiative_id}
                        className="staff-initiative-progress-row"
                      >
                        <span
                          className={`staff-milestone-dot ${tone}`}
                          aria-hidden
                        />
                        <div className="staff-initiative-progress-body min-w-0">
                          <div className="d-flex align-items-center gap-2 min-w-0">
                            <div className="fw-medium text-truncate flex-grow-1">
                              {initiative.label}
                            </div>
                            <span className="staff-initiative-progress-pct text-body-secondary">
                              {initiative.progress_pct >= 100
                                ? "Done"
                                : `${initiative.progress_pct}%`}
                            </span>
                            <span
                              className={`badge staff-milestone-badge ${tone}`}
                            >
                              {initiative.status.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div className="progress plan-milestone-bar staff-initiative-progress-bar">
                            <div
                              className={`progress-bar staff-initiative-progress-fill is-${barTone}`}
                              style={{
                                width: `${Math.min(100, initiative.progress_pct)}%`,
                              }}
                            />
                          </div>
                          <div className="small text-body-secondary text-truncate">
                            {initiative.owner}
                            {initiative.success_criteria
                              ? ` · ${initiative.success_criteria}`
                              : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsibleCard>
            </div>
          </div>
        )}
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
