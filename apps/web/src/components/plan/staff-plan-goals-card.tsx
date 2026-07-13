"use client";

import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faDiagramProject } from "@/lib/fontawesome-icons";
import type {
  StaffPlanDashboardGoal,
  StaffPlanDashboardTaskCounts,
} from "@/lib/plan/staff-plan-dashboard-types";

type StaffPlanGoalsCardProps = {
  goals: StaffPlanDashboardGoal[];
  taskCounts: StaffPlanDashboardTaskCounts;
  onManage: () => void;
};

export function StaffPlanGoalsCard({
  goals,
  taskCounts,
  onManage,
}: StaffPlanGoalsCardProps) {
  const donePct =
    taskCounts.total > 0
      ? Math.round((taskCounts.done / taskCounts.total) * 100)
      : 0;

  return (
    <div className="plan-goals col-lg-5">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="staff-section-heading mb-0">Plan goals</h3>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
          onClick={onManage}
          title="Manage plan goals"
          aria-label="Manage plan goals"
        >
          <FontAwesomeIcon icon={faDiagramProject} />
          Manage
        </button>
      </div>
      <div className="staff-stack-tight">
        {goals.map((goal) => (
          <div key={goal.goal_id} className="staff-observation">
            <span className="fw-semibold">{goal.label}:</span> {goal.target}
          </div>
        ))}
      </div>

      <h3 className="staff-section-heading mb-2 mt-3">Task progress</h3>
      <div className="staff-plan-task-summary">
        <div className="staff-plan-task-summary-stat">
          <div className="staff-kpi-value">{donePct}%</div>
          <div className="small text-body-secondary">tasks complete</div>
        </div>
        <div className="staff-plan-task-summary-breakdown small text-body-secondary">
          <span>{taskCounts.done} done</span>
          <span>{taskCounts.in_progress} in progress</span>
          <span>{taskCounts.not_started} not started</span>
          {taskCounts.blocked > 0 ? (
            <span className="text-danger">{taskCounts.blocked} blocked</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
