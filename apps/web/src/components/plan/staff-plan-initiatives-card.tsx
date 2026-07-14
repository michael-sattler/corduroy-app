"use client";

import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faDiagramProject } from "@/lib/fontawesome-icons";
import { planStatusTone } from "@/lib/plan/staff-plan-dashboard-format";
import type { StaffPlanDashboardInitiative } from "@/lib/plan/staff-plan-dashboard-types";

type StaffPlanInitiativesCardProps = {
  initiatives: StaffPlanDashboardInitiative[];
  onManage: () => void;
};

export function StaffPlanInitiativesCard({
  initiatives,
  onManage,
}: StaffPlanInitiativesCardProps) {
  return (
    <div className="app-card staff-dashboard-panel h-100 staff-initiatives-card">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="staff-section-heading mb-0">Initiatives</h3>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
          onClick={onManage}
          title="Manage initiatives"
          aria-label="Manage initiatives"
        >
          <FontAwesomeIcon icon={faDiagramProject} />
          Manage
        </button>
      </div>
      <div className="staff-stack-tight">
        {initiatives.map((initiative) => {
          const tone = planStatusTone(initiative.status);
          return (
            <div key={initiative.initiative_id} className="staff-milestone-row">
              <span className={`staff-milestone-dot ${tone}`} aria-hidden />
              <div className="flex-grow-1 min-w-0">
                <div className="fw-medium text-truncate">{initiative.label}</div>
                <div className="small text-body-secondary text-truncate">
                  {initiative.success_criteria}
                </div>
              </div>
              <span className="small text-body-secondary text-capitalize">
                {initiative.owner}
              </span>
              <span className={`badge staff-milestone-badge ${tone}`}>
                {initiative.status.replace(/_/g, " ")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
