"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorDrawer } from "@/components/ui/editor-drawer";
import { StaffKpiObservationPanel } from "@/components/plan/staff-kpi-observation-panel";
import { humanizeMetricValue, METRIC_WIDGET_TYPES } from "@/lib/metric-catalog-types";
import type {
  StaffPlanKpiEditorItem,
  StaffPlanKpiEditorResponse,
} from "@/lib/plan/staff-plan-kpi-editor-types";
import { staffObserveKpiFromWidget, type DashboardWidgetView } from "@/lib/widgets";

const REVIEW_CADENCES = ["daily", "weekly", "monthly", "quarterly"] as const;

type PlanKpiPatch = {
  baseline_snapshot?: number | null;
  baseline_established?: boolean;
  target?: string;
  target_value?: number | null;
  review_cadence?: string;
};

function toInput(value: number | null): string {
  return value === null ? "" : String(value);
}

function parseInput(value: string): number | null {
  if (!value.trim()) return null;
  const result = Number(value);
  if (!Number.isFinite(result)) throw new Error("Enter a valid number");
  return result;
}

export function StaffKpiManagementDrawer({
  clientId,
  clientName,
  widget,
  open,
  focusObservation = false,
  planPeriod,
  onClose,
  onDirty,
}: {
  clientId: string;
  clientName: string;
  widget: DashboardWidgetView | null;
  open: boolean;
  focusObservation?: boolean;
  planPeriod?: { start: string; end: string } | null;
  onClose: () => void;
  onDirty: () => void;
}) {
  const [kpi, setKpi] = useState<StaffPlanKpiEditorItem | null>(null);
  const [loadingKpi, setLoadingKpi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState<string | null>(null);
  const [targetValue, setTargetValue] = useState<string | null>(null);
  const [targetText, setTargetText] = useState<string | null>(null);
  const observeKpi = widget ? staffObserveKpiFromWidget(widget) : null;

  const loadKpi = useCallback(async () => {
    if (!widget?.plan_kpi_id) {
      setKpi(null);
      return;
    }
    setLoadingKpi(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/staff/plan/kpis?client_id=${encodeURIComponent(clientId)}`,
        { cache: "no-store" },
      );
      const body = (await res.json()) as StaffPlanKpiEditorResponse & {
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "Could not load plan KPI");
      const next = body.kpis.find((row) => row.kpi_id === widget.plan_kpi_id) ?? null;
      setKpi(next);
      if (!next) setError("This widget is no longer linked to an active plan KPI.");
    } catch (err) {
      setKpi(null);
      setError(err instanceof Error ? err.message : "Could not load plan KPI");
    } finally {
      setLoadingKpi(false);
    }
  }, [clientId, widget]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => void loadKpi(), 0);
    return () => window.clearTimeout(timer);
  }, [loadKpi, open]);

  useEffect(() => {
    if (!open || !focusObservation) return;
    const timer = window.setTimeout(() => {
      document
        .getElementById("record-observation")
        ?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [focusObservation, open]);

  async function patchKpi(patch: PlanKpiPatch) {
    if (!kpi) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/plan/kpis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, kpi_id: kpi.kpi_id, patch }),
      });
      const body = (await res.json()) as {
        kpi?: StaffPlanKpiEditorItem;
        error?: string;
      };
      if (!res.ok || !body.kpi) {
        throw new Error(body.error ?? "Could not update plan KPI");
      }
      setKpi(body.kpi);
      onDirty();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update plan KPI");
    } finally {
      setBusy(false);
    }
  }

  async function patchWidget(patch: { widget_type?: string; is_visible?: boolean }) {
    if (!widget) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/dashboard-widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: clientId, id: widget.id, patch }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Could not update dashboard widget");
      onDirty();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update dashboard widget");
    } finally {
      setBusy(false);
    }
  }

  return (
    <EditorDrawer
      open={open}
      onClose={onClose}
      eyebrow="Manage KPI"
      title={widget?.label ?? clientName}
      subtitle={`KPI ID [reference] ${kpi?.kpi_id ?? widget?.plan_kpi_id ?? "Not linked"}`}
      width="min(760px, 94vw)"
      className="editor-drawer-kpi-management"
    >
      {error ? <div className="alert alert-danger py-2 small">{error}</div> : null}

      <section className="app-card p-3 mb-3">
        <div className="d-flex justify-content-between gap-2 mb-3">
          <div>
            <h3 className="staff-section-heading text-uppercase small mb-1">
              KPI plan settings
            </h3>
            <p className="small text-body-secondary mb-0">
              Baseline and targets apply to this client&apos;s active plan.
            </p>
          </div>
        </div>
        {loadingKpi ? (
          <p className="small text-body-secondary mb-0">Loading plan settings…</p>
        ) : !kpi ? (
          <div className="alert alert-secondary small mb-0">
            This widget is not linked to an active plan KPI, so plan settings
            are unavailable.
          </div>
        ) : (
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label small" htmlFor={`baseline-${kpi.kpi_id}`}>
                Baseline
              </label>
              <div className="input-group input-group-sm">
                <input id={`baseline-${kpi.kpi_id}`} className="form-control" inputMode="decimal" value={baseline ?? toInput(kpi.baseline_snapshot)} disabled={busy} onChange={(e) => setBaseline(e.target.value)} onBlur={() => {
                  try {
                    const value = parseInput(baseline ?? toInput(kpi.baseline_snapshot));
                    if (value !== kpi.baseline_snapshot) void patchKpi({ baseline_snapshot: value, baseline_established: value !== null });
                  } catch (err) { setError(err instanceof Error ? err.message : "Could not save baseline"); }
                }} />
                <button type="button" className="btn btn-outline-secondary" disabled={busy} onClick={() => void patchKpi({ baseline_snapshot: null, baseline_established: false })}>Clear</button>
              </div>
              <div className="form-text">
                Entering a value establishes the baseline; clearing it removes the baseline.
              </div>
            </div>
            <div className="col-md-6">
              <label className="form-label small" htmlFor={`cadence-${kpi.kpi_id}`}>Review cadence</label>
              <select id={`cadence-${kpi.kpi_id}`} className="form-select form-select-sm" value={kpi.review_cadence} disabled={busy} onChange={(e) => void patchKpi({ review_cadence: e.target.value })}>
                {REVIEW_CADENCES.map((cadence) => <option key={cadence} value={cadence}>{cadence}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small" htmlFor={`target-value-${kpi.kpi_id}`}>Target value</label>
              <input id={`target-value-${kpi.kpi_id}`} className="form-control form-control-sm" inputMode="decimal" value={targetValue ?? toInput(kpi.target_value)} disabled={busy} onChange={(e) => setTargetValue(e.target.value)} onBlur={() => {
                try {
                  const value = parseInput(targetValue ?? toInput(kpi.target_value));
                  if (value !== kpi.target_value) void patchKpi({ target_value: value });
                } catch (err) { setError(err instanceof Error ? err.message : "Could not save target"); }
              }} />
            </div>
            <div className="col-md-6">
              <label className="form-label small" htmlFor={`target-text-${kpi.kpi_id}`}>Target display text</label>
              <input id={`target-text-${kpi.kpi_id}`} className="form-control form-control-sm" value={targetText ?? kpi.target} disabled={busy} onChange={(e) => setTargetText(e.target.value)} onBlur={() => {
                const value = targetText ?? kpi.target;
                if (value !== kpi.target) void patchKpi({ target: value });
              }} />
            </div>
          </div>
        )}
      </section>

      {widget ? <section className="app-card p-3 mb-3">
        <h3 className="staff-section-heading text-uppercase small mb-3">
          Dashboard display
        </h3>
        <div className="row g-3 align-items-end">
          <div className="col-sm-7">
            <label className="form-label small" htmlFor={`display-kind-${widget.id}`}>Display kind</label>
            <select id={`display-kind-${widget.id}`} className="form-select form-select-sm" defaultValue={widget.widget_type} disabled={busy} onChange={(e) => void patchWidget({ widget_type: e.target.value })}>
              {METRIC_WIDGET_TYPES.map((kind) => <option key={kind} value={kind}>{humanizeMetricValue(kind)}</option>)}
            </select>
          </div>
          <div className="col-sm-5">
            <div className="form-check form-switch mb-1">
              <input className="form-check-input" type="checkbox" role="switch" id={`widget-visible-${widget.id}`} defaultChecked disabled={busy} onChange={(e) => void patchWidget({ is_visible: e.target.checked })} />
              <label className="form-check-label" htmlFor={`widget-visible-${widget.id}`}>Shown on dashboard</label>
            </div>
          </div>
        </div>
      </section> : null}

      <section id={focusObservation ? "record-observation" : undefined} className="app-card p-3">
        <h3 className="staff-section-heading text-uppercase small mb-3">
          Record observation
        </h3>
        {observeKpi ? (
          <StaffKpiObservationPanel
            clientId={clientId}
            kpi={observeKpi}
            planPeriod={planPeriod}
            onRecorded={onDirty}
            onCancel={onClose}
          />
        ) : (
          <div className="alert alert-secondary small mb-0">This widget is not linked to a recordable client metric.</div>
        )}
      </section>
    </EditorDrawer>
  );
}
