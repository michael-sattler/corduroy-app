"use client";

import { useEffect, useState } from "react";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffPlanKpiEditorItem,
  StaffPlanKpiEditorResponse,
} from "@/lib/plan/staff-plan-kpi-editor-types";

type StaffClientKpiEditorPanelProps = {
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

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatBool(value: boolean): string {
  return value ? "Yes" : "No";
}

function formatNumber(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("en-US");
}

function Field({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`staff-kpi-editor-field${wide ? " is-wide" : ""}`}>
      <span className="staff-kpi-editor-label">{label}</span>
      <span className="staff-kpi-editor-value">{value}</span>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: StaffPlanKpiEditorItem }) {
  return (
    <div
      className={`staff-kpi-editor-card${kpi.is_active ? "" : " is-inactive"}`}
    >
      <div className="staff-kpi-editor-card-head">
        <div className="min-w-0">
          <div className="staff-kpi-editor-title">{kpi.label}</div>
          <div className="staff-kpi-editor-id">{kpi.kpi_id}</div>
        </div>
        <span
          className={`badge ${
            kpi.is_active ? "staff-badge-on-track" : "text-bg-secondary"
          }`}
        >
          {kpi.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="staff-kpi-editor-grid">
        <Field
          label="Current value"
          value={formatMetricValue(kpi.current_value, kpi.unit)}
        />
        <Field
          label="Target"
          value={
            kpi.target_value !== null
              ? formatMetricValue(kpi.target_value, kpi.unit)
              : kpi.target || "—"
          }
        />
        <Field label="Observed on" value={formatDate(kpi.current_value_observed_on)} />
        <Field label="Last observed at" value={formatDateTime(kpi.last_observed_at)} />
        <Field
          label="Baseline snapshot"
          value={formatNumber(kpi.baseline_snapshot)}
        />
        <Field
          label="Baseline established"
          value={formatBool(kpi.baseline_established)}
        />
        <Field label="Review cadence" value={<span className="text-capitalize">{kpi.review_cadence}</span>} />
        <Field label="Is active" value={formatBool(kpi.is_active)} />
        <Field
          label="Target (text)"
          value={kpi.target || "—"}
          wide
        />
        <Field
          label="Source binding"
          value={kpi.source_binding || "—"}
          wide
        />
      </div>
    </div>
  );
}

export function StaffClientKpiEditorPanel({
  clientId,
  active,
}: StaffClientKpiEditorPanelProps) {
  const [kpis, setKpis] = useState<StaffPlanKpiEditorItem[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;

    async function loadKpis() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/staff/plan/kpis?client_id=${encodeURIComponent(clientId)}`,
          { cache: "no-store" },
        );
        const body = (await res.json()) as StaffPlanKpiEditorResponse & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(body.error ?? "Could not load client KPIs");
        }

        if (!cancelled) {
          setKpis(body.kpis);
          setPlanId(body.plan_id);
        }
      } catch (err) {
        if (!cancelled) {
          setKpis([]);
          setError(
            err instanceof Error ? err.message : "Could not load client KPIs",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadKpis();

    return () => {
      cancelled = true;
    };
  }, [clientId, active, reloadToken]);

  if (loading) {
    return <p className="staff-dashboard-muted mb-0">Loading client KPIs…</p>;
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

  if (kpis.length === 0) {
    return (
      <p className="staff-dashboard-muted mb-0">
        No KPIs are defined for this client&apos;s active plan yet.
      </p>
    );
  }

  return (
    <div>
      <p className="small text-body-secondary mb-3">
        {kpis.length} KPI{kpis.length === 1 ? "" : "s"}
        {planId ? ` · ${planId}` : ""}
      </p>
      <div className="staff-kpi-editor-list">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.kpi_id} kpi={kpi} />
        ))}
      </div>
    </div>
  );
}
