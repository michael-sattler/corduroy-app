import { planThemes, planWeeks } from "@/lib/placeholder-data";

const days = ["Mon Apr 14", "Tue Apr 15", "Wed Apr 16", "Thu Apr 17", "Fri Apr 18"];

const milestones = [
  { label: "Pull & score all open quotes >$5K", value: 100, tone: "success" },
  { label: "Matt calls all Priority 1 quotes", value: 100, tone: "success" },
  { label: "Re-engage K.R. Allen, TCCI, Harwin, Va...", value: 50, tone: "purple" },
  { label: "Kyle follows up Priority 2 quotes", value: 40, tone: "warning" },
  { label: "Pipedrive reactivated & admin assigned", value: 0, tone: "muted" },
];

const dueToday = [
  {
    title: "Call Phillip Oxsheer at TCCI — confirm interior slab scope",
    tag: "Sales",
    note: "Script: reference K.R. Allen intro, ask about Q2 commercial schedule",
    assignee: "ME",
    accent: "accent-red",
  },
  {
    title: "Send follow-up to Harwin Properties on revised quote",
    tag: "Sales",
    note: "Attach updated interior slab pricing sheet",
    assignee: "ME",
    accent: "accent-red",
  },
];

const inProgress = [
  {
    title: "Score all open Quotient quotes >$5K by age",
    tag: "Pipeline",
    note: "Priority 1 = 90+ days; Priority 2 = 60–89 days",
    assignee: "KS",
    accent: "accent-blue",
  },
  {
    title: "Assign Pipedrive admin role to Kyle",
    tag: "Admin",
    note: "Pipeline owner for all new quotes",
    assignee: "AD",
    accent: "accent-purple",
  },
];

const completed = [
  "Pull all open quotes from Quotient API",
  "Matt completed K.R. Allen re-engagement call",
  "Upload Q1 P&L to data repository",
  "Review Week 2 milestone completion with advisor",
  "Update Pipedrive pipeline stages",
  "Send weekly progress summary to Corduroy",
];

export function ClientPlanView() {
  return (
    <div className="container-fluid py-4">
      <div className="row g-4">
        <div className="col-lg-3">
          <div className="app-card mb-4">
            <div className="plan-sidebar-label mb-3">April – June 2026</div>
            <div className="d-flex flex-column gap-3">
              {planWeeks.map((week) => (
                <div
                  key={week.week}
                  className={`plan-week-item${week.status === "active" ? " active" : ""}`}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-medium">{week.label}</span>
                    {week.status === "active" ? (
                      <span className="badge plan-today-badge">Today</span>
                    ) : null}
                  </div>
                  <div className="small text-body-secondary">{week.range}</div>
                  <div className="small mt-1">
                    {week.status === "complete"
                      ? "100% — complete"
                      : week.status === "active"
                        ? "3 of 5 days complete"
                        : "Upcoming"}
                  </div>
                  <div className="progress plan-week-progress mt-2">
                    <div
                      className={`progress-bar${week.status === "complete" ? " bg-success" : week.status === "active" ? " bg-primary" : ""}`}
                      style={{ width: `${week.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card">
            <div className="plan-sidebar-label mb-3">Initiative themes</div>
            <div className="d-flex flex-column gap-3">
              {planThemes.map((theme) => (
                <div key={theme.title} className="d-flex gap-2">
                  <span className={`theme-dot ${theme.color}`} aria-hidden />
                  <div>
                    <div className="fw-medium small">{theme.title}</div>
                    <div className="small text-body-secondary">{theme.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-lg-9">
          <div className="app-card">
            <div className="d-flex flex-wrap justify-content-between gap-3 mb-4">
              <div>
                <h2 className="h4 mb-1">Week 3 — Commercial push & follow-up</h2>
                <p className="text-body-secondary mb-0">
                  Apr 14–18, 2026 · Pipeline activation & GC relationships
                </p>
              </div>
              <div className="d-flex gap-2 align-items-start">
                <span className="badge plan-status-on-track">On track</span>
                <span className="badge plan-status-tasks">8 tasks remaining</span>
              </div>
            </div>

            <div className="plan-day-tabs mb-4">
              {days.map((day) => (
                <span
                  key={day}
                  className={`plan-day-tab${day === "Thu Apr 17" ? " active" : ""}`}
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="plan-focus-banner mb-4">
              <div className="plan-focus-icon">🕐</div>
              <div className="flex-grow-1">
                <div className="fw-semibold">Thursday, April 17</div>
                <div className="small">
                  GC outreach day — focus: interior slab opportunities
                </div>
              </div>
              <span className="badge plan-status-tasks">4 tasks today</span>
            </div>

            <section className="mb-4">
              <h3 className="h6 mb-3">Week 3 milestone progress</h3>
              <div className="small text-body-secondary mb-2">3 of 5 complete</div>
              <div className="d-flex flex-column gap-3">
                {milestones.map((m) => (
                  <div key={m.label}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span>{m.label}</span>
                      <span className="text-body-secondary">
                        {m.value === 100 ? "Done" : m.value === 0 ? "0%" : `${m.value}%`}
                      </span>
                    </div>
                    <div className="progress plan-milestone-bar">
                      <div
                        className={`progress-bar bg-${m.tone === "purple" ? "primary" : m.tone === "warning" ? "warning" : m.tone === "muted" ? "secondary" : "success"}`}
                        style={{ width: `${m.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <TaskSection title="Due today" count={2} icon="!" tone="danger">
              {dueToday.map((task) => (
                <TaskRow key={task.title} {...task} />
              ))}
            </TaskSection>

            <TaskSection title="In progress" count={2} icon="⚡" tone="primary">
              {inProgress.map((task) => (
                <TaskRow key={task.title} {...task} />
              ))}
            </TaskSection>

            <TaskSection title="Completed earlier this week" count={6} icon="✓" tone="success">
              {completed.map((title) => (
                <div key={title} className="plan-task-row completed">
                  <input type="checkbox" className="form-check-input" checked readOnly />
                  <div className="flex-grow-1">
                    <div className="text-decoration-line-through">{title}</div>
                    <div className="small text-body-secondary">Completed this week</div>
                  </div>
                  <span className="badge bg-success-subtle text-success">Done</span>
                </div>
              ))}
            </TaskSection>
          </div>
        </div>
      </div>
    </div>
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
        {title} <span className="text-body-secondary fw-normal">({count} tasks)</span>
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
}: {
  title: string;
  tag: string;
  note: string;
  assignee: string;
  accent: string;
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
      <span className="badge plan-today-badge">Today</span>
      <span className="plan-avatar">{assignee}</span>
    </div>
  );
}
