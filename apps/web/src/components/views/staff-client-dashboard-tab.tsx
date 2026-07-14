"use client";

import { useEffect, useState } from "react";
import { EditorDrawer } from "@/components/ui/editor-drawer";
import { StaffClientKpiEditorPanel } from "@/components/plan/staff-client-kpi-editor-panel";
import { StaffTaskProgressCard } from "@/components/plan/staff-task-progress-card";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faPen } from "@/lib/fontawesome-icons";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffPlanDashboard,
  StaffPlanDashboardResponse,
} from "@/lib/plan/staff-plan-dashboard-types";
import type { StaffPlanTaskProgress } from "@/lib/plan/staff-task-progress";
import type { StaffClientActivity } from "@/lib/staff-client-activity-types";
import type { StaffDashboardClient } from "@/lib/staff-dashboard-types";

type StaffClientDashboardTabProps = {
  client: StaffDashboardClient;
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

export function StaffClientDashboardTab({ client }: StaffClientDashboardTabProps) {
  const [kpis, setKpis] = useState<StaffPlanDashboard["kpis"]>([]);
  const [taskProgress, setTaskProgress] = useState<StaffPlanTaskProgress>({
    overdue: 0,
    pending: 0,
    blocked: 0,
  });
  const [activity, setActivity] = useState<StaffClientActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [hasPlan, setHasPlan] = useState(true);
  const [kpiEditorOpen, setKpiEditorOpen] = useState(false);

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
          setHasPlan(Boolean(planBody.plan));
          setKpis(planBody.plan?.kpis ?? []);
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
          setKpis([]);
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
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="staff-section-heading mb-0">Plan KPIs</h3>
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
        {!hasPlan ? (
          <p className="staff-dashboard-muted mb-0">
            No active plan for {client.name} yet. KPIs will appear after a plan
            is ingested.
          </p>
        ) : kpis.length === 0 ? (
          <p className="staff-dashboard-muted mb-0">
            This plan does not have KPI metrics yet.
          </p>
        ) : (
          <div className="row g-2 staff-kpi-grid">
            {kpis.map((kpi) => (
              <div key={kpi.kpi_id} className="col-6 col-xl-3">
                <div className={`staff-kpi-card${kpi.at_risk ? " at-risk" : ""}`}>
                  <div
                    className="small text-body-secondary text-truncate"
                    title={kpi.label}
                  >
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
        <div className="col-lg-4">
          <StaffTaskProgressCard progress={taskProgress} />
        </div>
      </div>

      <EditorDrawer
        open={kpiEditorOpen}
        onClose={() => {
          setKpiEditorOpen(false);
          setReloadToken((token) => token + 1);
        }}
        title="Client KPIs"
        subtitle={client.name}
        className="editor-drawer-kpis"
      >
        <StaffClientKpiEditorPanel clientId={client.id} active={kpiEditorOpen} />
      </EditorDrawer>
    </div>
  );
}
