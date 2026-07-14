import type { StaffPlanTaskProgress } from "@/lib/plan/staff-task-progress";

type StaffTaskProgressCardProps = {
  progress: StaffPlanTaskProgress;
};

export function StaffTaskProgressCard({ progress }: StaffTaskProgressCardProps) {
  return (
    <div className="app-card staff-dashboard-panel h-100 staff-task-progress-card">
      <h3 className="staff-section-heading mb-3">Task progress</h3>
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
