import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faListCheck } from "@/lib/fontawesome-icons";
import type { StaffPlanTaskProgress } from "@/lib/plan/staff-task-progress";

type StaffTaskProgressCardProps = {
  progress: StaffPlanTaskProgress;
  /** When set, shows a Tasks button that opens the plan view. */
  onOpenTasks?: () => void;
};

export function StaffTaskProgressCard({
  progress,
  onOpenTasks,
}: StaffTaskProgressCardProps) {
  return (
    <div className="app-card staff-dashboard-panel h-100 staff-task-progress-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="staff-section-heading mb-0">Task progress</h3>
        {onOpenTasks ? (
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={onOpenTasks}
            title="Open Current Plan"
            aria-label="Open Current Plan"
          >
            <FontAwesomeIcon icon={faListCheck} />
            Tasks
          </button>
        ) : null}
      </div>
      <div className="staff-task-progress-stats">
        <div className="staff-task-progress-stat">
          <div
            className={`staff-task-progress-value${
              progress.overdue > 0 ? " is-alert" : ""
            }`}
          >
            {progress.overdue}
          </div>
          <div className="staff-task-progress-label">Overdue</div>
        </div>
        <div className="staff-task-progress-stat">
          <div
            className={`staff-task-progress-value${
              progress.pending === 0 ? " is-ok" : ""
            }`}
          >
            {progress.pending}
          </div>
          <div className="staff-task-progress-label">Pending</div>
        </div>
        <div className="staff-task-progress-stat">
          <div
            className={`staff-task-progress-value${
              progress.blocked > 0 ? " is-alert" : ""
            }`}
          >
            {progress.blocked}
          </div>
          <div className="staff-task-progress-label">Blocked</div>
        </div>
      </div>
    </div>
  );
}
