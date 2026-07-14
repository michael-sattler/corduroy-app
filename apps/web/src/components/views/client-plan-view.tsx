"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPlanPeriod } from "@/lib/plan/staff-plan-dashboard-format";
import type {
  ClientPlanDashboard,
  ClientPlanDashboardResponse,
  ClientPlanTask,
} from "@/lib/plan/client-plan-dashboard-types";
import { PlanKpiWidgets } from "@/components/views/plan-kpi-widgets";

function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function ownerLabel(owner: string): string {
  if (owner === "client") return "Client";
  if (owner === "corduroy") return "Corduroy";
  if (owner === "both") return "Client + Corduroy";
  return owner;
}

function ownerInitials(owner: string): string {
  if (owner === "client") return "CL";
  if (owner === "corduroy") return "CD";
  if (owner === "both") return "C+";
  return owner.slice(0, 2).toUpperCase();
}

function priorityAccent(priority: string): string {
  if (priority === "high") return "accent-red";
  if (priority === "medium") return "accent-blue";
  return "accent-purple";
}

function defaultWeekId(weeks: ClientPlanDashboard["weeks"]): string | null {
  const active = weeks.find((w) => w.status === "active");
  if (active) return active.id;
  const upcoming = weeks.find((w) => w.status === "upcoming");
  if (upcoming) return upcoming.id;
  return weeks.length > 0 ? weeks[weeks.length - 1].id : null;
}

export function ClientPlanView() {
  const [dashboard, setDashboard] = useState<ClientPlanDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

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
          throw new Error(body.error ?? "Could not load your plan");
        }

        if (!cancelled) {
          setDashboard(body.plan);
          setSelectedWeekId(body.plan ? defaultWeekId(body.plan.weeks) : null);
        }
      } catch (err) {
        if (!cancelled) {
          setDashboard(null);
          setError(err instanceof Error ? err.message : "Could not load your plan");
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

  const selectedWeek = useMemo(
    () => dashboard?.weeks.find((w) => w.id === selectedWeekId) ?? null,
    [dashboard, selectedWeekId],
  );

  const weekTasks = useMemo(
    () =>
      dashboard && selectedWeek
        ? dashboard.tasks.filter((t) => t.week_ids.includes(selectedWeek.id))
        : [],
    [dashboard, selectedWeek],
  );

  const todoTasks = weekTasks.filter(
    (t) => t.status === "not_started" || t.status === "blocked",
  );
  const inProgressTasks = weekTasks.filter((t) => t.status === "in_progress");
  const completedTasks = weekTasks.filter(
    (t) => t.status === "done" || t.status === "skipped",
  );

  if (loading) {
    return (
      <div className="container-fluid py-3 client-plan-view">
        <div className="app-card p-3 text-body-secondary">Loading your plan…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid py-3 client-plan-view">
        <div className="app-card p-3 text-danger">{error}</div>
      </div>
    );
  }

  if (!dashboard || !selectedWeek) {
    return (
      <div className="container-fluid py-3 client-plan-view">
        <div className="app-card p-3 text-body-secondary">
          Your plan isn&apos;t set up yet. Check back soon.
        </div>
      </div>
    );
  }

  const hasBlocked = weekTasks.some((t) => t.status === "blocked");
  const statusLabel = hasBlocked
    ? "Needs attention"
    : selectedWeek.status === "complete"
      ? "Complete"
      : "On track";
  const tasksRemaining = todoTasks.length + inProgressTasks.length;
  const initiativesComplete = dashboard.initiatives.filter(
    (i) => i.progress_pct >= 100 || i.status === "done",
  ).length;

  return (
    <div className="container-fluid py-3 client-plan-view">
      <div className="row g-3">
        <div className="col-12 col-lg-3 plan-left-col">
          <div className="app-card mb-3">
            <div className="plan-sidebar-label mb-2">
              {formatPlanPeriod(dashboard.plan.period_start, dashboard.plan.period_end)}
            </div>
            <div className="d-flex flex-column gap-2">
              {dashboard.weeks.map((week) => (
                <button
                  key={week.id}
                  type="button"
                  className={`plan-week-item border-0 text-start w-100${week.id === selectedWeek.id ? " active" : ""}`}
                  onClick={() => setSelectedWeekId(week.id)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-medium">Week {week.week_number}</span>
                    {week.status === "active" ? (
                      <span className="badge plan-today-badge">Current</span>
                    ) : null}
                  </div>
                  <div className="plan-week-dates text-body-secondary">
                    {formatShortDate(week.start_date)} – {formatShortDate(week.end_date)}
                  </div>
                  <div className="progress plan-week-progress">
                    <div
                      className={`progress-bar${week.status === "complete" ? " bg-success" : week.status === "active" ? " bg-primary" : ""}`}
                      style={{ width: `${week.progress_pct}%` }}
                    />
                  </div>
                  <div className="plan-week-status">
                    {week.status === "complete"
                      ? `${week.progress_pct}% — complete`
                      : week.status === "active"
                        ? `${week.progress_pct}% — in progress`
                        : "Upcoming"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg">
          <div className="d-flex flex-column gap-3">
            <div className="plan-week-header app-card bg-app-staff-blue">
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                <div>
                  <h2 className="h5 mb-1">Week {selectedWeek.week_number}</h2>
                  <p className="small mb-0">
                    {formatShortDate(selectedWeek.start_date)} –{" "}
                    {formatShortDate(selectedWeek.end_date)}
                    {selectedWeek.month_name ? ` · ${selectedWeek.month_name}` : ""}
                  </p>
                </div>
                <div className="d-flex gap-2 align-items-start flex-wrap">
                  <span
                    className={`badge ${statusLabel === "On track" ? "plan-status-on-track" : "plan-status-tasks"}`}
                  >
                    {statusLabel}
                  </span>
                  <span className="badge plan-status-tasks">
                    {tasksRemaining} tasks remaining
                  </span>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2">
                {dashboard.goals.map((goal) => (
                  <span
                    key={goal.goal_id}
                    className="badge rounded-pill text-bg-light border"
                    title={goal.description}
                  >
                    {goal.label}
                  </span>
                ))}
              </div>
            </div>

            {dashboard.kpis.length > 0 ? (
              <CollapsibleCard title={<div className="plan-sidebar-label">Key metrics</div>}>
                <PlanKpiWidgets kpis={dashboard.kpis} />
              </CollapsibleCard>
            ) : null}

            <div className="plan-focus-banner">
              <div className="plan-focus-icon">🕐</div>
              <div className="flex-grow-1">
                <div className="fw-semibold">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="small">
                  {dashboard.current_month?.theme ??
                    `Plan status: ${dashboard.plan.status}`}
                </div>
              </div>
              <span className="badge plan-status-tasks">
                {tasksRemaining} active tasks
              </span>
            </div>

            <div className=" row g-3">
              <div className="plan-goals-card col-12 col-md-6">
                <CollapsibleCard
                  title={<div className="plan-sidebar-label">Goals</div>}
                >
                  <div className="d-flex flex-column gap-2">
                    {dashboard.goals.map((goal) => (
                      <div key={goal.goal_id} className="small">
                        <div className="fw-medium">{goal.label}</div>
                        <div className="text-body-secondary">
                          {goal.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleCard>
              </div>
              <div className="plan-initiatives-card  col-12 col-md-6">
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

            <TaskSection title="To do" count={todoTasks.length} icon="!" tone="danger">
              {todoTasks.length === 0 ? (
                <EmptyTasks message="Nothing to do this week." />
              ) : (
                todoTasks.map((task) => <TaskRow key={task.id} task={task} />)
              )}
            </TaskSection>

            <TaskSection
              title="In progress"
              count={inProgressTasks.length}
              icon="⚡"
              tone="primary"
            >
              {inProgressTasks.length === 0 ? (
                <EmptyTasks message="No tasks in progress this week." />
              ) : (
                inProgressTasks.map((task) => <TaskRow key={task.id} task={task} />)
              )}
            </TaskSection>

            <TaskSection
              title="Completed this week"
              count={completedTasks.length}
              icon="✓"
              tone="success"
            >
              {completedTasks.length === 0 ? (
                <EmptyTasks message="No completed tasks yet this week." />
              ) : (
                completedTasks.map((task) => (
                  <div key={task.id} className="plan-task-row completed">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked
                      readOnly
                    />
                    <div className="flex-grow-1">
                      <div className="text-decoration-line-through">{task.label}</div>
                      <div className="small text-body-secondary">
                        {task.category}
                        {task.initiative_label ? ` · ${task.initiative_label}` : ""}
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success">
                      {task.status === "skipped" ? "Skipped" : "Done"}
                    </span>
                  </div>
                ))
              )}
            </TaskSection>
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
  title: React.ReactNode;
  children: React.ReactNode;
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

function EmptyTasks({ message }: { message: string }) {
  return <div className="small text-body-secondary py-1 px-1">{message}</div>;
}

function TaskSection({
  title,
  count,
  icon,
  tone,
  children,
}: {
  title: string;
  count: number;
  icon: string;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <section className="plan-task-section">
      <h3 className={`h6 mb-0 plan-section-heading text-${tone}`}>
        <span className="plan-section-icon">{icon}</span>
        {title} <span className="text-body-secondary fw-normal">({count} tasks)</span>
      </h3>
      <div className="d-flex flex-column gap-2">{children}</div>
    </section>
  );
}

function TaskRow({ task }: { task: ClientPlanTask }) {
  return (
    <div className={`plan-task-row ${priorityAccent(task.priority)}`}>
      <input type="checkbox" className="form-check-input" readOnly />
      <div className="flex-grow-1 min-w-0">
        <div className="fw-medium">{task.label}</div>
        <div className="d-flex gap-2 align-items-center mt-1 flex-wrap">
          <span className="badge plan-task-tag">{task.category}</span>
          <span className="small text-body-secondary">
            {task.is_meeting ? "Meeting · " : ""}
            {ownerLabel(task.owner)}
            {task.initiative_label ? ` · ${task.initiative_label}` : ""}
          </span>
        </div>
      </div>
      <span className="badge plan-today-badge text-capitalize">
        {task.priority}
      </span>
      <span className="plan-avatar" title={ownerLabel(task.owner)}>
        {ownerInitials(task.owner)}
      </span>
    </div>
  );
}
