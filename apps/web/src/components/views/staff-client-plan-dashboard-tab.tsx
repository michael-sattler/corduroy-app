"use client";

import { useEffect, useState } from "react";
import { EditorDrawer } from "@/components/ui/editor-drawer";
import { StaffClientKpiEditorPanel } from "@/components/plan/staff-client-kpi-editor-panel";
import { StaffClientPlanStructurePanel } from "@/components/plan/staff-client-plan-structure-panel";
import { StaffClientTasksPanel } from "@/components/plan/staff-client-tasks-panel";
import { StaffKpiObservationPanel } from "@/components/plan/staff-kpi-observation-panel";
import { StaffPlanGoalsCard } from "@/components/plan/staff-plan-goals-card";
import { StaffPlanInitiativesCard } from "@/components/plan/staff-plan-initiatives-card";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faListCheck, faPen, faPlus } from "@/lib/fontawesome-icons";
import {
  formatMetricValue,
  formatPlanPeriod,
  taskStatusLabel,
} from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffPlanDashboard,
  StaffPlanDashboardKpi,
  StaffPlanDashboardResponse,
} from "@/lib/plan/staff-plan-dashboard-types";

type StaffClientPlanDashboardTabProps = {
  clientId: string;
  clientName: string;
};

function kpiSubtext(kpi: StaffPlanDashboard["kpis"][number]): string {
  if (!kpi.baseline_established) {
    return "Baseline not yet established";
  }

  if (kpi.progress_pct !== null) {
    return `Target ${kpi.target} · ${kpi.progress_pct}% of goal`;
  }

  if (kpi.current_value === null) {
    return `Target ${kpi.target} · no reading yet`;
  }

  return `Target ${kpi.target}`;
}

export function StaffClientPlanDashboardTab({
  clientId,
  clientName,
}: StaffClientPlanDashboardTabProps) {
  const [dashboard, setDashboard] = useState<StaffPlanDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [kpiEditorOpen, setKpiEditorOpen] = useState(false);
  const [initiativesEditorOpen, setInitiativesEditorOpen] = useState(false);
  const [goalsEditorOpen, setGoalsEditorOpen] = useState(false);
  const [tasksEditorOpen, setTasksEditorOpen] = useState(false);
  const [observeKpi, setObserveKpi] = useState<StaffPlanDashboardKpi | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/staff/plan/dashboard?client_id=${encodeURIComponent(clientId)}`,
          { cache: "no-store" },
        );
        const body = (await res.json()) as StaffPlanDashboardResponse & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(body.error ?? "Could not load plan dashboard");
        }

        if (!cancelled) {
          setDashboard(body.plan);
        }
      } catch (err) {
        if (!cancelled) {
          setDashboard(null);
          setError(
            err instanceof Error ? err.message : "Could not load plan dashboard",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [clientId, reloadToken]);

  if (loading) {
    return (
      <div className="staff-plan-dashboard">
        <p className="staff-dashboard-muted mb-0">Loading plan data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-plan-dashboard">
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

  if (!dashboard) {
    return (
      <div className="staff-plan-dashboard">
        <h3 className="staff-section-heading mb-2">No active plan</h3>
        <p className="staff-dashboard-muted mb-0">
          {clientName} does not have an active plan in the database yet.
          Use <strong>Documents</strong> to upload and ingest a plan JSON.
        </p>
      </div>
    );
  }

  const { plan, current_month, kpis, initiatives, goals, task_counts, focus_tasks } =
    dashboard;

  return (
    <div className="staff-plan-dashboard">
      <div className="staff-plan-dashboard-header mb-3">
        <div>
          <h3 className="staff-section-heading mb-1">{plan.plan_id}</h3>
          <p className="staff-dashboard-muted mb-0">
            {formatPlanPeriod(plan.period_start, plan.period_end)}
            {current_month ? ` · ${current_month.name}` : ""}
          </p>
          {current_month?.theme ? (
            <p className="small text-body-secondary mb-0 mt-1">{current_month.theme}</p>
          ) : null}
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge staff-badge-on-track text-capitalize">{plan.status}</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={() => setKpiEditorOpen(true)}
            title="Edit client KPIs"
            aria-label="Edit client KPIs"
          >
            <FontAwesomeIcon icon={faPen} />
            Edit KPIs
          </button>
        </div>
      </div>

      <div className="row g-2 staff-kpi-grid mb-3">
        {kpis.map((kpi) => (
          <div key={kpi.kpi_id} className="col-6 col-xl-3">
            <div className={`staff-kpi-card${kpi.at_risk ? " at-risk" : ""}`}>
              <button
                type="button"
                className="staff-kpi-observe"
                onClick={() => setObserveKpi(kpi)}
                title={`Record observation for ${kpi.label}`}
                aria-label={`Record observation for ${kpi.label}`}
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
              <div className="small text-body-secondary text-truncate" title={kpi.label}>
                {kpi.label}
              </div>
              <div className="staff-kpi-value">
                {formatMetricValue(kpi.current_value, kpi.unit)}
              </div>
              <div className="small text-body-secondary">{kpiSubtext(kpi)}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3 mb-3">
        <StaffPlanInitiativesCard
          initiatives={initiatives}
          onManage={() => setInitiativesEditorOpen(true)}
        />
        <StaffPlanGoalsCard
          goals={goals}
          taskCounts={task_counts}
          onManage={() => setGoalsEditorOpen(true)}
        />
      </div>

      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="staff-section-heading mb-0">Focus tasks</h3>
          <div className="d-flex align-items-center gap-2">
            <span className="staff-dashboard-muted">
              {focus_tasks.length} of {task_counts.total} open
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
              onClick={() => setTasksEditorOpen(true)}
              title="Manage tasks"
              aria-label="Manage tasks"
            >
              <FontAwesomeIcon icon={faListCheck} />
              Manage
            </button>
          </div>
        </div>
        <div className="staff-milestone-list">
          {focus_tasks.map((task, index) => (
            <div key={task.task_id} className="staff-action-row">
              <span className="staff-action-num">{index + 1}</span>
              <div className="flex-grow-1 min-w-0">
                <div className="fw-medium text-truncate">{task.label}</div>
                <div className="small text-body-secondary text-truncate">
                  {task.category} · {task.owner}
                </div>
              </div>
              <span
                className={`badge staff-action-badge ${
                  task.priority === "high"
                    ? "warning"
                    : task.status === "blocked"
                      ? "danger"
                      : "success"
                }`}
              >
                {taskStatusLabel(task.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <EditorDrawer
        open={kpiEditorOpen}
        onClose={() => setKpiEditorOpen(false)}
        title="Client KPIs"
        subtitle={clientName}
      >
        <StaffClientKpiEditorPanel clientId={clientId} active={kpiEditorOpen} />
      </EditorDrawer>

      <EditorDrawer
        open={initiativesEditorOpen}
        onClose={() => setInitiativesEditorOpen(false)}
        title="Initiatives"
        subtitle={clientName}
      >
        <StaffClientPlanStructurePanel
          clientId={clientId}
          active={initiativesEditorOpen}
          section="initiatives"
        />
      </EditorDrawer>

      <EditorDrawer
        open={goalsEditorOpen}
        onClose={() => setGoalsEditorOpen(false)}
        title="Plan goals"
        subtitle={clientName}
      >
        <StaffClientPlanStructurePanel
          clientId={clientId}
          active={goalsEditorOpen}
          section="goals"
        />
      </EditorDrawer>

      <EditorDrawer
        open={tasksEditorOpen}
        onClose={() => setTasksEditorOpen(false)}
        title="Tasks"
        subtitle={clientName}
      >
        <StaffClientTasksPanel clientId={clientId} active={tasksEditorOpen} />
      </EditorDrawer>

      <EditorDrawer
        open={observeKpi !== null}
        onClose={() => setObserveKpi(null)}
        title="Record observation"
        subtitle={observeKpi ? observeKpi.label : clientName}
        width="440px"
      >
        {observeKpi ? (
          <StaffKpiObservationPanel
            clientId={clientId}
            kpi={observeKpi}
            onRecorded={() => setReloadToken((token) => token + 1)}
            onCancel={() => setObserveKpi(null)}
          />
        ) : null}
      </EditorDrawer>
    </div>
  );
}
