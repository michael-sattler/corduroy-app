"use client";

import { useEffect, useState } from "react";
import { taskStatusLabel } from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffPlanTaskItem,
  StaffPlanTasksResponse,
} from "@/lib/plan/staff-plan-tasks-types";

type StaffClientTasksPanelProps = {
  clientId: string;
  active: boolean;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T12:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusTone(status: string): string {
  switch (status) {
    case "done":
      return "success";
    case "blocked":
      return "danger";
    case "in_progress":
      return "warning";
    default:
      return "secondary";
  }
}

function priorityTone(priority: string): string {
  switch (priority) {
    case "high":
      return "warning";
    case "low":
      return "light";
    default:
      return "info";
  }
}

function TaskCard({ task }: { task: StaffPlanTaskItem }) {
  return (
    <div className={`staff-task-card status-${task.status}`}>
      <div className="staff-task-card-head">
        <div className="min-w-0">
          <div className="staff-task-title">{task.label}</div>
          <div className="staff-task-id">{task.task_id}</div>
        </div>
        <div className="staff-task-head-badges">
          <span className={`badge text-bg-${priorityTone(task.priority)}`}>
            {task.priority}
          </span>
          <span className={`badge staff-milestone-badge ${statusTone(task.status)}`}>
            {taskStatusLabel(task.status)}
          </span>
        </div>
      </div>

      {task.deliverable ? (
        <p className="staff-task-deliverable mb-0">{task.deliverable}</p>
      ) : null}

      <div className="staff-task-pills">
        {task.initiative_name ? (
          <span className="badge staff-task-pill pill-initiative">
            {task.initiative_name}
          </span>
        ) : null}
        {task.is_recurring ? (
          <span className="badge staff-task-pill pill-recurring">Recurring</span>
        ) : null}
        {task.is_meeting ? (
          <span className="badge staff-task-pill pill-meeting">Meeting</span>
        ) : null}
        {task.category ? (
          <span className="badge staff-task-pill">{task.category}</span>
        ) : null}
        <span className="badge staff-task-pill text-capitalize">{task.owner}</span>
      </div>

      <div className="staff-task-dates">
        <span>
          <span className="staff-kpi-editor-label">Created</span>{" "}
          {formatDate(task.created_at)}
        </span>
        <span>
          <span className="staff-kpi-editor-label">Due</span>{" "}
          {formatDate(task.due_date)}
        </span>
        <span>
          <span className="staff-kpi-editor-label">Last touched</span>{" "}
          {formatDate(task.last_touched_at)}
        </span>
      </div>
    </div>
  );
}

export function StaffClientTasksPanel({
  clientId,
  active,
}: StaffClientTasksPanelProps) {
  const [data, setData] = useState<StaffPlanTasksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;

    async function loadTasks() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/staff/plan/tasks?client_id=${encodeURIComponent(clientId)}`,
          { cache: "no-store" },
        );
        const body = (await res.json()) as StaffPlanTasksResponse & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(body.error ?? "Could not load tasks");
        }

        if (!cancelled) {
          setData(body);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Could not load tasks");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadTasks();

    return () => {
      cancelled = true;
    };
  }, [clientId, active, reloadToken]);

  if (loading) {
    return <p className="staff-dashboard-muted mb-0">Loading tasks…</p>;
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-danger mb-2" role="alert">
          {error}
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => setReloadToken((token) => token + 1)}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.tasks.length === 0) {
    return (
      <p className="staff-dashboard-muted mb-0">
        No tasks are defined for this client&apos;s active plan yet.
      </p>
    );
  }

  return (
    <div>
      <p className="small text-body-secondary mb-3">
        {data.tasks.length} task{data.tasks.length === 1 ? "" : "s"}
        {data.plan_id ? ` · ${data.plan_id}` : ""} · sorted by due date
      </p>
      <div className="staff-task-list">
        {data.tasks.map((task) => (
          <TaskCard key={task.task_id} task={task} />
        ))}
      </div>
    </div>
  );
}
