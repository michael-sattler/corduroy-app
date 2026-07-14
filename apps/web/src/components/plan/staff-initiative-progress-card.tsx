"use client";

import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faDiagramProject } from "@/lib/fontawesome-icons";
import { planStatusTone } from "@/lib/plan/staff-plan-dashboard-format";
import type { StaffPlanDashboardInitiative } from "@/lib/plan/staff-plan-dashboard-types";

type StaffInitiativeProgressCardProps = {
  initiatives: StaffPlanDashboardInitiative[];
  onOpenPlan?: () => void;
};

function progressBarTone(initiative: StaffPlanDashboardInitiative): string {
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

export function StaffInitiativeProgressCard({
  initiatives,
  onOpenPlan,
}: StaffInitiativeProgressCardProps) {
  const completeCount = initiatives.filter(
    (initiative) =>
      initiative.progress_pct >= 100 || initiative.status === "done",
  ).length;

  return (
    <div className="app-card staff-dashboard-panel h-100 staff-initiative-progress-card">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="staff-section-heading mb-0">Initiative progress</h3>
        <div className="d-flex align-items-center gap-2">
          <span className="staff-dashboard-muted">
            {completeCount} of {initiatives.length} complete
          </span>
          {onOpenPlan ? (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              onClick={onOpenPlan}
              title="Open Current Plan"
              aria-label="Open Current Plan"
            >
              <FontAwesomeIcon icon={faDiagramProject} />
              Plan
            </button>
          ) : null}
        </div>
      </div>

      {initiatives.length === 0 ? (
        <p className="staff-dashboard-muted mb-0">No initiatives on this plan yet.</p>
      ) : (
        <div className="staff-stack-tight">
          {initiatives.map((initiative) => {
            const tone = planStatusTone(initiative.status);
            const barTone = progressBarTone(initiative);

            return (
              <div
                key={initiative.initiative_id}
                className="staff-initiative-progress-row"
              >
                <span className={`staff-milestone-dot ${tone}`} aria-hidden />
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
                      style={{ width: `${Math.min(100, initiative.progress_pct)}%` }}
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
      )}
    </div>
  );
}
