"use client";

import { useEffect, useState } from "react";
import { EditorDrawer } from "@/components/ui/editor-drawer";
import { StaffClientKpiEditorPanel } from "@/components/plan/staff-client-kpi-editor-panel";
import { StaffInitiativeProgressCard } from "@/components/plan/staff-initiative-progress-card";
import { StaffKpiManagementDrawer } from "@/components/plan/staff-kpi-management-drawer";
import { StaffTaskProgressCard } from "@/components/plan/staff-task-progress-card";
import { DashboardWidgetGrid } from "@/components/widgets/dashboard-widget-grid";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faPen } from "@/lib/fontawesome-icons";
import type {
  StaffPlanDashboardInitiative,
  StaffPlanDashboardResponse,
} from "@/lib/plan/staff-plan-dashboard-types";
import type { StaffPlanTaskProgress } from "@/lib/plan/staff-task-progress";
import type { StaffClientActivity } from "@/lib/staff-client-activity-types";
import type { StaffDashboardClient } from "@/lib/staff-dashboard-types";
import type { DashboardWidgetView } from "@/lib/widgets";

type StaffClientDashboardTabProps = {
  client: StaffDashboardClient;
  onOpenPlan?: () => void;
};

function formatLastLogin(iso: string | null): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatPlanPeriod(start: string, end: string): string {
  const format = (value: string) =>
    new Date(`${value}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  return `${format(start)} – ${format(end)}`;
}

export function StaffClientDashboardTab({
  client,
  onOpenPlan,
}: StaffClientDashboardTabProps) {
  const [widgets, setWidgets] = useState<DashboardWidgetView[]>([]);
  const [planPeriod, setPlanPeriod] = useState<{ start: string; end: string } | null>(
    null,
  );
  const [initiatives, setInitiatives] = useState<StaffPlanDashboardInitiative[]>(
    [],
  );
  const [taskProgress, setTaskProgress] = useState<StaffPlanTaskProgress>({
    overdue: 0,
    pending: 0,
    blocked: 0,
  });
  const [activity, setActivity] = useState<StaffClientActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [kpiEditorOpen, setKpiEditorOpen] = useState(false);
  const [kpiEditorDirty, setKpiEditorDirty] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<DashboardWidgetView | null>(
    null,
  );
  const [focusObservation, setFocusObservation] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [planRes, activityRes] = await Promise.all([
          fetch(
            `/api/staff/plan/dashboard?client_id=${encodeURIComponent(client.id)}`,
            { cache: "no-store" },
          ),
          fetch(
            `/api/staff/client-activity?client_id=${encodeURIComponent(client.id)}`,
            { cache: "no-store" },
          ),
        ]);

        const planBody = (await planRes.json()) as StaffPlanDashboardResponse & {
          error?: string;
        };
        const activityBody = (await activityRes.json()) as {
          activity?: StaffClientActivity;
          error?: string;
        };

        if (!planRes.ok) {
          throw new Error(planBody.error ?? "Could not load KPIs");
        }
        if (!activityRes.ok) {
          throw new Error(activityBody.error ?? "Could not load activity");
        }

        if (!cancelled) {
          setWidgets(planBody.widgets ?? []);
          setPlanPeriod(
            planBody.plan
              ? {
                  start: planBody.plan.plan.period_start,
                  end: planBody.plan.plan.period_end,
                }
              : null,
          );
          setInitiatives(planBody.plan?.initiatives ?? []);
          setTaskProgress(
            planBody.plan?.task_progress ?? {
              overdue: 0,
              pending: 0,
              blocked: 0,
            },
          );
          setActivity(activityBody.activity ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setWidgets([]);
          setPlanPeriod(null);
          setInitiatives([]);
          setTaskProgress({ overdue: 0, pending: 0, blocked: 0 });
          setActivity(null);
          setError(err instanceof Error ? err.message : "Could not load dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [client.id, reloadToken]);

  if (loading) {
    return (
      <div className="staff-dashboard-grid">
        <p className="staff-dashboard-muted mb-0">Loading client dashboard…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="staff-dashboard-grid">
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

  return (
    <div className="staff-dashboard-grid">
      <div className="app-card staff-dashboard-panel mb-2">
        {planPeriod ? (
          <p className="staff-dashboard-muted small mb-2">
            Plan period: {formatPlanPeriod(planPeriod.start, planPeriod.end)}
          </p>
        ) : null}
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
            No dashboard widgets assigned for {client.name} yet. Open{" "}
            <strong>Edit KPIs → Dashboard widgets</strong> to assign display
            kinds to client metrics.
          </p>
        ) : (
          <DashboardWidgetGrid
            widgets={widgets}
            onSelectWidget={(widget) => {
              setFocusObservation(false);
              setSelectedWidget(widget);
            }}
            renderActions={(widget) => {
              return (
                <button
                  type="button"
                  className="staff-kpi-observe"
                  onClick={(event) => {
                    event.stopPropagation();
                    setFocusObservation(true);
                    setSelectedWidget(widget);
                  }}
                  title={`Manage ${widget.label}`}
                  aria-label={`Manage ${widget.label}`}
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
              );
            }}
          />
        )}
      </div>

      <div className="app-card staff-dashboard-panel mb-2">
        <h3 className="staff-section-heading mb-3">Recent client activity</h3>
        <div className="row g-2 staff-activity-grid">
          <div className="col-6 col-lg-3">
            <div className="staff-activity-stat">
              <div className="staff-activity-stat-value">
                {activity?.dialogue_messages_sent ?? 0}
              </div>
              <div className="staff-activity-stat-label">Dialogue messages</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="staff-activity-stat">
              <div className="staff-activity-stat-value">
                {activity?.llm_messages_sent ?? 0}
              </div>
              <div className="staff-activity-stat-label">LLM messages</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="staff-activity-stat">
              <div className="staff-activity-stat-value">
                {activity?.tasks_completed ?? 0}
              </div>
              <div className="staff-activity-stat-label">Tasks completed</div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="staff-activity-stat">
              <div className="staff-activity-stat-value staff-activity-stat-date">
                {formatLastLogin(activity?.last_login_at ?? null)}
              </div>
              <div className="staff-activity-stat-label">Last login</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-2">
        <div className="col-lg-8">
          <StaffInitiativeProgressCard
            initiatives={initiatives}
            onOpenPlan={onOpenPlan}
          />
        </div>
        <div className="col-lg-4">
          <StaffTaskProgressCard
            progress={taskProgress}
            onOpenTasks={onOpenPlan}
          />
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
        subtitle={client.name}
        className="editor-drawer-kpis"
      >
        <StaffClientKpiEditorPanel
          clientId={client.id}
          active={kpiEditorOpen}
          onDirty={() => setKpiEditorDirty(true)}
        />
      </EditorDrawer>

      <StaffKpiManagementDrawer
        key={selectedWidget?.id ?? "no-widget"}
        clientId={client.id}
        clientName={client.name}
        widget={selectedWidget}
        open={selectedWidget !== null}
        focusObservation={focusObservation}
        planPeriod={planPeriod}
        onClose={() => {
          setFocusObservation(false);
          setSelectedWidget(null);
        }}
        onDirty={() => setReloadToken((token) => token + 1)}
      />
    </div>
  );
}
