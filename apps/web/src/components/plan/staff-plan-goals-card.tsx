"use client";

import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faDiagramProject } from "@/lib/fontawesome-icons";
import type { StaffPlanDashboardGoal } from "@/lib/plan/staff-plan-dashboard-types";

type StaffPlanGoalsCardProps = {
  goals: StaffPlanDashboardGoal[];
  onManage: () => void;
};

/** Priority 1 (highest) is fullest purple; higher ranks fade out. */
function priorityCircleOpacity(priority: number): number {
  const rank = Math.max(1, Math.round(priority));
  return Math.max(0.28, Math.min(1, 1.05 - (rank - 1) * 0.18));
}

export function StaffPlanGoalsCard({
  goals,
  onManage,
}: StaffPlanGoalsCardProps) {
  return (
    <div className="app-card staff-dashboard-panel h-100 staff-goals-card">
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
          <div key={goal.goal_id} className="staff-goal-row">
            <div className="staff-goal-body min-w-0">
              <div className="staff-goal-label">{goal.label}</div>
              {goal.description ? (
                <div className="staff-goal-meta">{goal.description}</div>
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
    </div>
  );
}
