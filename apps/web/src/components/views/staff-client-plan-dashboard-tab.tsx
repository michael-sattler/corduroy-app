"use client";

import { useEffect, useState } from "react";
import { EditorDrawer } from "@/components/ui/editor-drawer";
import { StaffClientKpiEditorPanel } from "@/components/plan/staff-client-kpi-editor-panel";
import { StaffClientPlanStructurePanel } from "@/components/plan/staff-client-plan-structure-panel";
import { StaffClientTasksPanel } from "@/components/plan/staff-client-tasks-panel";
import { StaffKpiObservationPanel } from "@/components/plan/staff-kpi-observation-panel";
import { StaffFocusTasksCard } from "@/components/plan/staff-focus-tasks-card";
import { StaffPlanGoalsCard } from "@/components/plan/staff-plan-goals-card";
import { StaffPlanInitiativesCard } from "@/components/plan/staff-plan-initiatives-card";
import { StaffTaskProgressCard } from "@/components/plan/staff-task-progress-card";
import { DashboardWidgetGrid } from "@/components/widgets/dashboard-widget-grid";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faPen, faPlus } from "@/lib/fontawesome-icons";
import { formatPlanPeriod } from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffPlanDashboard,
  StaffPlanDashboardKpi,
  StaffPlanDashboardResponse,
} from "@/lib/plan/staff-plan-dashboard-types";
import {
  staffObserveKpiFromWidget,
  type DashboardWidgetView,
} from "@/lib/widgets";

type StaffClientPlanDashboardTabProps = {
  clientId: string;
  clientName: string;
};

export function StaffClientPlanDashboardTab({
  clientId,
  clientName,
}: StaffClientPlanDashboardTabProps) {
  const [dashboard, setDashboard] = useState<StaffPlanDashboard | null>(null);
  const [widgets, setWidgets] = useState<DashboardWidgetView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [kpiEditorOpen, setKpiEditorOpen] = useState(false);
  const [kpiEditorDirty, setKpiEditorDirty] = useState(false);
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
          setWidgets(body.widgets ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          setDashboard(null);
          setWidgets([]);
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

  const metricsPanel = (
      <div className="app-card staff-dashboard-panel mb-2">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="staff-section-heading mb-0">Key metrics</h3>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
            onClick={() => {
              setKpiEditorDirty(false);
              setKpiEditorOpen(true);
            }}
            title="Edit client KPIs"
            aria-label="Edit client KPIs"
          >
            <FontAwesomeIcon icon={faPen} />
            Edit KPIs
          </button>
        </div>
        {widgets.length === 0 ? (
          <p className="staff-dashboard-muted mb-0">
            No dashboard widgets assigned yet. Open{" "}
            <strong>Edit KPIs → Dashboard widgets</strong> to assign display
            kinds.
          </p>
        ) : (
          <DashboardWidgetGrid
            widgets={widgets}
            renderActions={(widget) => {
              const kpi = staffObserveKpiFromWidget(widget);
              if (!kpi) return null;
              return (
                <button
                  type="button"
                  className="staff-kpi-observe"
                  onClick={() => setObserveKpi(kpi)}
                  title={`Record observation for ${kpi.label}`}
                  aria-label={`Record observation for ${kpi.label}`}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
              );
            }}
          />
        )}
      </div>
  );

  if (!dashboard) {
    return (
      <div className="staff-plan-dashboard">
        <h3 className="staff-section-heading mb-2">No active plan</h3>
        <p className="staff-dashboard-muted mb-3">
          {clientName} does not have an active plan in the database yet.
          Use <strong>Documents</strong> to upload and ingest a plan JSON.
        </p>
        {metricsPanel}
        <EditorDrawer
          open={kpiEditorOpen}
          onClose={() => {
            setKpiEditorOpen(false);
            if (kpiEditorDirty) {
              setKpiEditorDirty(false);
              setReloadToken((token) => token + 1);
            }
          }}
          title="Client KPIs"
          subtitle={clientName}
          className="editor-drawer-kpis"
        >
          <StaffClientKpiEditorPanel
            clientId={clientId}
            active={kpiEditorOpen}
            onDirty={() => setKpiEditorDirty(true)}
          />
        </EditorDrawer>
        <EditorDrawer
          open={observeKpi !== null}
          onClose={() => setObserveKpi(null)}
          title="Record observation"
          subtitle={observeKpi ? observeKpi.label : clientName}
          width="440px"
          className="editor-drawer-observation"
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

  const {
    plan,
    current_month,
    initiatives,
    goals,
    task_progress,
    focus_tasks,
    focus_weeks,
  } = dashboard;

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
        <span className="badge staff-badge-on-track text-capitalize">{plan.status}</span>
      </div>

      {metricsPanel}

      <div className="row g-2 mb-2">
        <div className="col-lg-7">
          <StaffPlanInitiativesCard
            initiatives={initiatives}
            onManage={() => setInitiativesEditorOpen(true)}
          />
        </div>
        <div className="col-lg-5">
          <StaffPlanGoalsCard
            goals={goals}
            onManage={() => setGoalsEditorOpen(true)}
          />
        </div>
      </div>

      <div className="row g-2">
        <div className="col-lg-8">
          <StaffFocusTasksCard
            weeks={focus_weeks ?? []}
            fallbackTasks={focus_tasks}
            onManage={() => setTasksEditorOpen(true)}
          />
        </div>
        <div className="col-lg-4">
          <StaffTaskProgressCard progress={task_progress} />
        </div>
      </div>

      <EditorDrawer
        open={kpiEditorOpen}
        onClose={() => {
          setKpiEditorOpen(false);
          if (kpiEditorDirty) {
            setKpiEditorDirty(false);
            setReloadToken((token) => token + 1);
          }
        }}
        title="Client KPIs"
        subtitle={clientName}
        className="editor-drawer-kpis"
      >
        <StaffClientKpiEditorPanel
          clientId={clientId}
          active={kpiEditorOpen}
          onDirty={() => setKpiEditorDirty(true)}
        />
      </EditorDrawer>

      <EditorDrawer
        open={initiativesEditorOpen}
        onClose={() => setInitiativesEditorOpen(false)}
        title="Initiatives"
        subtitle={clientName}
        className="editor-drawer-initiatives"
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
        className="editor-drawer-goals"
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
        className="editor-drawer-tasks"
      >
        <StaffClientTasksPanel clientId={clientId} active={tasksEditorOpen} />
      </EditorDrawer>

      <EditorDrawer
        open={observeKpi !== null}
        onClose={() => setObserveKpi(null)}
        title="Record observation"
        subtitle={observeKpi ? observeKpi.label : clientName}
        width="440px"
        className="editor-drawer-observation"
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
