"use client";

import { useEffect, useMemo, useState } from "react";
import {
  buildPlanWeeks,
  defaultDayIndex,
  defaultWeekIndex,
  formatDayTab,
  formatIso,
  formatPeriodLabel,
  groupTasksForDay,
  milestoneTone,
  milestonesForWeek,
  participantInitials,
  phaseForWeek,
  phaseThemeColor,
  planStatusLabel,
  remainingTaskCount,
  workdaysInWeek,
} from "@/lib/plan/derive";
import type { PlanDocument } from "@/lib/plan/types";
import { PlanKpiWidgets } from "@/components/views/plan-kpi-widgets";

const PLAN_URL = "/data/sample-plan.json";

export function ClientPlanView() {
  const [doc, setDoc] = useState<PlanDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [weekIndex, setWeekIndex] = useState(0);
  const [dayIndex, setDayIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        const res = await fetch(PLAN_URL);
        if (!res.ok) {
          throw new Error(`Failed to load plan (${res.status})`);
        }
        const data = (await res.json()) as PlanDocument;
        if (cancelled) return;

        const weeks = buildPlanWeeks(data);
        const initialWeek = defaultWeekIndex(weeks);
        const days = workdaysInWeek(weeks[initialWeek]);

        setDoc(data);
        setWeekIndex(initialWeek);
        setDayIndex(defaultDayIndex(days));
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load plan");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  const weeks = useMemo(() => (doc ? buildPlanWeeks(doc) : []), [doc]);
  const selectedWeek = weeks[weekIndex];
  const workdays = useMemo(
    () => (selectedWeek ? workdaysInWeek(selectedWeek) : []),
    [selectedWeek],
  );
  const selectedDay = workdays[dayIndex];
  const selectedDayIso = selectedDay ? formatIso(selectedDay) : "";

  const phase = useMemo(
    () =>
      doc && selectedWeek
        ? phaseForWeek(selectedWeek.week, doc.phases)
        : undefined,
    [doc, selectedWeek],
  );

  const milestones = useMemo(
    () =>
      doc && selectedWeek
        ? milestonesForWeek(selectedWeek, doc.milestones, phase)
        : [],
    [doc, selectedWeek, phase],
  );

  const taskGroups = useMemo(
    () =>
      doc && selectedWeek && selectedDayIso
        ? groupTasksForDay(doc, selectedWeek, selectedDayIso)
        : { dueToday: [], inProgress: [], completed: [] },
    [doc, selectedWeek, selectedDayIso],
  );

  if (loading) {
    return (
      <div className="container-fluid py-4">
        <div className="app-card p-4 text-body-secondary">Loading your plan…</div>
      </div>
    );
  }

  if (error || !doc || !selectedWeek || !selectedDay) {
    return (
      <div className="container-fluid py-4">
        <div className="app-card p-4 text-danger">
          {error ?? "Plan data is unavailable."}
        </div>
      </div>
    );
  }

  const milestoneComplete = milestones.filter(
    (m) => m.current_pct_complete >= 100 || m.current_status === "achieved",
  ).length;
  const statusLabel = planStatusLabel(doc, selectedWeek);
  const openTasks = remainingTaskCount(doc);

  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        <div className="col-lg-3">
          <div className="app-card mb-4">
            <div className="plan-sidebar-label mb-3">
              {formatPeriodLabel(doc.plan.period_start, doc.plan.period_end)}
            </div>
            <div className="d-flex flex-column gap-3">
              {weeks.map((week, index) => (
                <button
                  key={week.week}
                  type="button"
                  className={`plan-week-item border-0 text-start w-100${index === weekIndex ? " active" : ""}`}
                  onClick={() => {
                    setWeekIndex(index);
                    setDayIndex(defaultDayIndex(workdaysInWeek(week)));
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-medium">{week.label}</span>
                    {week.status === "active" ? (
                      <span className="badge plan-today-badge">Current</span>
                    ) : null}
                  </div>
                  <div className="small text-body-secondary">{week.range}</div>
                  <div className="small mt-1">
                    {week.status === "complete"
                      ? `${week.progress}% — complete`
                      : week.status === "active"
                        ? `${week.progress}% — in progress`
                        : "Upcoming"}
                  </div>
                  <div className="progress plan-week-progress mt-2">
                    <div
                      className={`progress-bar${week.status === "complete" ? " bg-success" : week.status === "active" ? " bg-primary" : ""}`}
                      style={{ width: `${week.progress}%` }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="app-card mb-4">
            <div className="plan-sidebar-label mb-3">Goals</div>
            <div className="d-flex flex-column gap-2">
              {doc.goals.map((goal) => (
                <div key={goal.id} className="small">
                  <div className="fw-medium">{goal.name}</div>
                  <div className="text-body-secondary">{goal.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card">
            <div className="plan-sidebar-label mb-3">Initiative themes</div>
            <div className="d-flex flex-column gap-3">
              {doc.phases.map((theme, index) => (
                <div key={theme.id} className="d-flex gap-2">
                  <span
                    className={`theme-dot ${phaseThemeColor(index)}`}
                    aria-hidden
                  />
                  <div>
                    <div className="fw-medium small">{theme.name}</div>
                    <div className="small text-body-secondary">
                      {theme.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="app-card">
            <div className="d-flex flex-wrap justify-content-between gap-3 mb-3">
              <div>
                <h2 className="h4 mb-1">
                  {selectedWeek.label}
                  {phase ? ` — ${phase.name}` : ""}
                </h2>
                <p className="text-body-secondary mb-0">
                  {selectedWeek.range} · {doc.plan.client_name}
                </p>
              </div>
              <div className="d-flex gap-2 align-items-start flex-wrap">
                <span
                  className={`badge ${statusLabel === "On track" ? "plan-status-on-track" : "plan-status-tasks"}`}
                >
                  {statusLabel}
                </span>
                <span className="badge plan-status-tasks">
                  {openTasks} tasks remaining
                </span>
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-4">
              {doc.goals.map((goal) => (
                <span
                  key={goal.id}
                  className="badge rounded-pill text-bg-light border"
                  title={goal.description}
                >
                  {goal.name}
                </span>
              ))}
            </div>

            <PlanKpiWidgets kpis={doc.kpis} />

            <div className="plan-day-tabs mb-4">
              {workdays.map((day, index) => (
                <button
                  key={formatIso(day)}
                  type="button"
                  className={`plan-day-tab border-0 bg-transparent${index === dayIndex ? " active" : ""}`}
                  onClick={() => setDayIndex(index)}
                >
                  {formatDayTab(day)}
                </button>
              ))}
            </div>

            <div className="plan-focus-banner mb-4">
              <div className="plan-focus-icon">🕐</div>
              <div className="flex-grow-1">
                <div className="fw-semibold">
                  {selectedDay.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <div className="small">
                  {phase?.description ?? doc.plan.description}
                </div>
              </div>
              <span className="badge plan-status-tasks">
                {taskGroups.dueToday.length + taskGroups.inProgress.length}{" "}
                active tasks
              </span>
            </div>

            {doc.risks.length > 0 ? (
              <div className="alert alert-warning py-2 px-3 small mb-4">
                <div className="fw-semibold mb-1">Risks to watch</div>
                <ul className="mb-0 ps-3">
                  {doc.risks.map((risk) => (
                    <li key={risk.id}>
                      <span className="fw-medium">{risk.name}</span>
                      <span className="text-body-secondary">
                        {" "}
                        — {risk.current_severity} severity ·{" "}
                        {participantInitials(risk.owner_id, doc.participants)}{" "}
                        owns mitigation
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <section className="mb-4">
              <h3 className="h6 mb-3">{selectedWeek.label} milestone progress</h3>
              <div className="small text-body-secondary mb-2">
                {milestoneComplete} of {milestones.length} complete
              </div>
              <div className="d-flex flex-column gap-3">
                {milestones.map((m) => {
                  const tone = milestoneTone(m);
                  return (
                    <div key={m.id}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>{m.name}</span>
                        <span className="text-body-secondary">
                          {m.current_pct_complete >= 100
                            ? "Done"
                            : m.current_pct_complete === 0
                              ? "0%"
                              : `${m.current_pct_complete}%`}
                        </span>
                      </div>
                      <div className="progress plan-milestone-bar">
                        <div
                          className={`progress-bar bg-${tone === "purple" ? "primary" : tone === "warning" ? "warning" : tone === "muted" ? "secondary" : "success"}`}
                          style={{ width: `${m.current_pct_complete}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <TaskSection
              title="Due today"
              count={taskGroups.dueToday.length}
              icon="!"
              tone="danger"
            >
              {taskGroups.dueToday.length === 0 ? (
                <EmptyTasks message="Nothing due today." />
              ) : (
                taskGroups.dueToday.map((task) => (
                  <TaskRow key={task.id} {...task} />
                ))
              )}
            </TaskSection>

            <TaskSection
              title="In progress"
              count={taskGroups.inProgress.length}
              icon="⚡"
              tone="primary"
            >
              {taskGroups.inProgress.length === 0 ? (
                <EmptyTasks message="No tasks in progress for this day." />
              ) : (
                taskGroups.inProgress.map((task) => (
                  <TaskRow key={task.id} {...task} />
                ))
              )}
            </TaskSection>

            <TaskSection
              title="Completed this week"
              count={taskGroups.completed.length}
              icon="✓"
              tone="success"
            >
              {taskGroups.completed.length === 0 ? (
                <EmptyTasks message="No completed tasks yet this week." />
              ) : (
                taskGroups.completed.map((task) => (
                  <div key={task.id} className="plan-task-row completed">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked
                      readOnly
                    />
                    <div className="flex-grow-1">
                      <div className="text-decoration-line-through">
                        {task.title}
                      </div>
                      <div className="small text-body-secondary">
                        {task.tag}
                      </div>
                    </div>
                    <span className="badge bg-success-subtle text-success">
                      Done
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

function EmptyTasks({ message }: { message: string }) {
  return (
    <div className="small text-body-secondary py-2 px-1">{message}</div>
  );
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
    <section className="mb-4">
      <h3 className={`h6 plan-section-heading text-${tone}`}>
        <span className="plan-section-icon">{icon}</span>
        {title}{" "}
        <span className="text-body-secondary fw-normal">({count} tasks)</span>
      </h3>
      <div className="d-flex flex-column gap-2">{children}</div>
    </section>
  );
}

function TaskRow({
  title,
  tag,
  note,
  assignee,
  accent,
  overdue,
}: {
  title: string;
  tag: string;
  note: string;
  assignee: string;
  accent: string;
  overdue?: boolean;
}) {
  return (
    <div className={`plan-task-row ${accent}`}>
      <input type="checkbox" className="form-check-input" readOnly />
      <div className="flex-grow-1 min-w-0">
        <div className="fw-medium">{title}</div>
        <div className="d-flex gap-2 align-items-center mt-1 flex-wrap">
          <span className="badge plan-task-tag">{tag}</span>
          <span className="small text-body-secondary">{note}</span>
        </div>
      </div>
      <span className="badge plan-today-badge">
        {overdue ? "Overdue" : "Today"}
      </span>
      <span className="plan-avatar">{assignee}</span>
    </div>
  );
}
