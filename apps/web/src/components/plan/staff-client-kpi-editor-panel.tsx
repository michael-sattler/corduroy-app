"use client";

import { useEffect, useState } from "react";
import { StaffClientDashboardWidgetsPanel } from "@/components/plan/staff-client-dashboard-widgets-panel";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffPlanKpiEditorItem,
  StaffPlanKpiEditorResponse,
} from "@/lib/plan/staff-plan-kpi-editor-types";
import type {
  StaffMetricObservation,
  StaffMetricObservationsByMetricResponse,
} from "@/lib/plan/staff-metric-observations-types";

type StaffClientKpiEditorPanelProps = {
  clientId: string;
  active: boolean;
  /** Raised when plan KPIs or dashboard widgets change. */
  onDirty?: () => void;
};

type EditorTab = "plan_kpis" | "dashboard_widgets" | "metric_observations";

const REVIEW_CADENCES = ["daily", "weekly", "monthly", "quarterly"] as const;

const CHANGE_SOURCE_LABELS: Record<string, string> = {
  manual_advisor: "Advisor",
  manual_client: "Client",
  agent_ingest: "AI",
  connector_sync: "Connector",
  reconciliation: "Reconciliation",
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

function formatTimestamp(value: string | null): string {
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

function numberToInput(value: number | null): string {
  return value === null || value === undefined ? "" : String(value);
}

function parseNumberInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    throw new Error("Enter a valid number");
  }
  return num;
}

/** Best-effort number from display targets like "50%+", "$21,000+", "10+ per month". */
function parseNumberFromTargetText(raw: string): number | null {
  const cleaned = raw.replace(/[$,%\s]/g, "");
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : null;
}

function EditableKpiCard({
  clientId,
  kpi,
  busy,
  onPatch,
}: {
  clientId: string;
  kpi: StaffPlanKpiEditorItem;
  busy: boolean;
  onPatch: (
    kpiId: string,
    patch: {
      baseline_snapshot?: number | null;
      baseline_established?: boolean;
      target?: string;
      target_value?: number | null;
      review_cadence?: string;
    },
  ) => Promise<void>;
}) {
  const [baselineInput, setBaselineInput] = useState(
    numberToInput(kpi.baseline_snapshot),
  );
  const [targetValueInput, setTargetValueInput] = useState(
    numberToInput(kpi.target_value),
  );
  const [targetText, setTargetText] = useState(kpi.target);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setBaselineInput(numberToInput(kpi.baseline_snapshot));
    setTargetValueInput(numberToInput(kpi.target_value));
    setTargetText(kpi.target);
    setLocalError(null);
  }, [kpi]);

  async function saveBaseline() {
    setLocalError(null);
    try {
      const baseline = parseNumberInput(baselineInput);
      await onPatch(kpi.kpi_id, {
        baseline_snapshot: baseline,
        baseline_established: baseline !== null,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not save baseline");
    }
  }

  async function useCurrentAsBaseline() {
    if (kpi.current_value === null) return;
    setLocalError(null);
    setBaselineInput(String(kpi.current_value));
    try {
      await onPatch(kpi.kpi_id, {
        baseline_snapshot: kpi.current_value,
        baseline_established: true,
      });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not set baseline from current",
      );
    }
  }

  async function clearBaseline() {
    setLocalError(null);
    setBaselineInput("");
    try {
      await onPatch(kpi.kpi_id, {
        baseline_snapshot: null,
        baseline_established: false,
      });
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not clear baseline");
    }
  }

  async function saveTargetValue() {
    setLocalError(null);
    try {
      const targetValue = parseNumberInput(targetValueInput);
      await onPatch(kpi.kpi_id, { target_value: targetValue });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not save target value",
      );
    }
  }

  async function useParsedTargetFromText() {
    const parsed = parseNumberFromTargetText(targetText || kpi.target);
    if (parsed === null) {
      setLocalError("Could not parse a number from the display target text");
      return;
    }
    setLocalError(null);
    setTargetValueInput(String(parsed));
    try {
      await onPatch(kpi.kpi_id, { target_value: parsed });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not save target value",
      );
    }
  }

  async function clearTargetValue() {
    setLocalError(null);
    setTargetValueInput("");
    try {
      await onPatch(kpi.kpi_id, { target_value: null });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not clear target value",
      );
    }
  }

  async function saveTargetText() {
    setLocalError(null);
    try {
      await onPatch(kpi.kpi_id, { target: targetText });
    } catch (err) {
      setLocalError(
        err instanceof Error ? err.message : "Could not save target text",
      );
    }
  }

  const hasNumericTarget = kpi.target_value !== null;
  const suggestedTarget = parseNumberFromTargetText(targetText || kpi.target);

  return (
    <div
      className={`staff-kpi-editor-card${kpi.is_active ? "" : " is-inactive"}`}
    >
      <div className="staff-kpi-editor-card-head">
        <div className="min-w-0">
          <div className="staff-kpi-editor-title">{kpi.label}</div>
          <div className="staff-kpi-editor-id">{kpi.kpi_id}</div>
        </div>
        <div className="d-flex flex-wrap gap-1 justify-content-end">
          <span
            className={`badge ${
              kpi.baseline_established
                ? "staff-badge-on-track"
                : "text-bg-warning"
            }`}
          >
            {kpi.baseline_established ? "Baseline set" : "No baseline"}
          </span>
          <span
            className={`badge ${
              hasNumericTarget ? "staff-badge-on-track" : "text-bg-warning"
            }`}
          >
            {hasNumericTarget ? "Target set" : "No numeric target"}
          </span>
        </div>
      </div>

      {localError ? (
        <div className="alert alert-danger py-1 px-2 small mb-2" role="alert">
          {localError}
        </div>
      ) : null}

      <div className="staff-kpi-editor-grid">
        <div className="staff-kpi-editor-field">
          <span className="staff-kpi-editor-label">Current value</span>
          <span className="staff-kpi-editor-value">
            {formatMetricValue(kpi.current_value, kpi.unit)}
          </span>
          <span className="small text-body-secondary">
            as of {formatDate(kpi.current_value_observed_on)}
          </span>
        </div>

        <div className="staff-kpi-editor-field">
          <label
            className="staff-kpi-editor-label"
            htmlFor={`cadence-${clientId}-${kpi.kpi_id}`}
          >
            Review cadence
          </label>
          <select
            id={`cadence-${clientId}-${kpi.kpi_id}`}
            className="form-select form-select-sm"
            value={kpi.review_cadence}
            disabled={busy}
            onChange={(e) =>
              void onPatch(kpi.kpi_id, { review_cadence: e.target.value })
            }
          >
            {REVIEW_CADENCES.map((cadence) => (
              <option key={cadence} value={cadence}>
                {cadence}
              </option>
            ))}
          </select>
        </div>

        <div className="staff-kpi-editor-field is-wide">
          <label
            className="staff-kpi-editor-label"
            htmlFor={`baseline-${kpi.kpi_id}`}
          >
            Baseline snapshot
          </label>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
              id={`baseline-${kpi.kpi_id}`}
              type="text"
              inputMode="decimal"
              className="form-control form-control-sm"
              style={{ maxWidth: "9rem" }}
              value={baselineInput}
              disabled={busy}
              onChange={(e) => setBaselineInput(e.target.value)}
              onBlur={() => {
                const next = baselineInput.trim();
                const prev = numberToInput(kpi.baseline_snapshot);
                if (next === prev) return;
                void saveBaseline();
              }}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={busy || kpi.current_value === null}
              onClick={() => void useCurrentAsBaseline()}
              title="Set baseline from the latest observation"
            >
              Use current
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={busy || (!kpi.baseline_established && !kpi.baseline_snapshot)}
              onClick={() => void clearBaseline()}
            >
              Clear
            </button>
          </div>
        </div>

        <div className="staff-kpi-editor-field is-wide">
          <label
            className="staff-kpi-editor-label"
            htmlFor={`target-value-${kpi.kpi_id}`}
          >
            Target value (numeric — required for progress)
          </label>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <input
              id={`target-value-${kpi.kpi_id}`}
              type="text"
              inputMode="decimal"
              className="form-control form-control-sm"
              style={{ maxWidth: "9rem" }}
              placeholder="e.g. 50"
              value={targetValueInput}
              disabled={busy}
              onChange={(e) => setTargetValueInput(e.target.value)}
              onBlur={() => {
                const next = targetValueInput.trim();
                const prev = numberToInput(kpi.target_value);
                if (next === prev) return;
                void saveTargetValue();
              }}
            />
            <button
              type="button"
              className="btn btn-sm btn-outline-primary"
              disabled={busy || suggestedTarget === null}
              onClick={() => void useParsedTargetFromText()}
              title={
                suggestedTarget === null
                  ? "No number found in display target text"
                  : `Use ${suggestedTarget} parsed from display text`
              }
            >
              {suggestedTarget === null
                ? "Parse from text"
                : `Use ${suggestedTarget}`}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={busy || !hasNumericTarget}
              onClick={() => void clearTargetValue()}
            >
              Clear
            </button>
          </div>
          <span className="small text-body-secondary">
            Display text alone does not drive progress math.
          </span>
        </div>

        <div className="staff-kpi-editor-field is-wide">
          <label
            className="staff-kpi-editor-label"
            htmlFor={`target-text-${kpi.kpi_id}`}
          >
            Target (display text)
          </label>
          <input
            id={`target-text-${kpi.kpi_id}`}
            type="text"
            className="form-control form-control-sm"
            value={targetText}
            disabled={busy}
            onChange={(e) => setTargetText(e.target.value)}
            onBlur={() => {
              if (targetText.trim() === kpi.target.trim()) return;
              void saveTargetText();
            }}
          />
        </div>

        <div className="staff-kpi-editor-field is-wide">
          <span className="staff-kpi-editor-label">Source binding</span>
          <span className="staff-kpi-editor-value">
            {kpi.source_binding || "—"}
          </span>
        </div>
      </div>
    </div>
  );
}

function PlanKpisTab({
  clientId,
  active,
  onDirty,
}: {
  clientId: string;
  active: boolean;
  onDirty?: () => void;
}) {
  const [kpis, setKpis] = useState<StaffPlanKpiEditorItem[]>([]);
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!active) return;

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
        if (!cancelled) setLoading(false);
      }
    }

    void loadKpis();
    return () => {
      cancelled = true;
    };
  }, [clientId, active, reloadToken]);

  async function patchKpi(
    kpiId: string,
    patch: {
      baseline_snapshot?: number | null;
      baseline_established?: boolean;
      target?: string;
      target_value?: number | null;
      review_cadence?: string;
    },
  ) {
    setBusyId(kpiId);
    setError(null);
    try {
      const res = await fetch("/api/staff/plan/kpis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          kpi_id: kpiId,
          patch,
        }),
      });
      const body = (await res.json()) as {
        kpi?: StaffPlanKpiEditorItem;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "Could not update plan KPI");
      }
      if (body.kpi) {
        setKpis((prev) =>
          prev.map((row) => (row.kpi_id === kpiId ? body.kpi! : row)),
        );
        onDirty?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update plan KPI");
      throw err;
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return <p className="staff-dashboard-muted mb-0">Loading client KPIs…</p>;
  }

  if (error && kpis.length === 0) {
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

  const missingBaseline = kpis.filter((k) => !k.baseline_established).length;
  const missingNumericTarget = kpis.filter((k) => k.target_value === null).length;

  return (
    <div>
      {error ? (
        <div className="alert alert-danger mb-2" role="alert">
          {error}
        </div>
      ) : null}
      <p className="small text-body-secondary mb-3">
        {kpis.length} KPI{kpis.length === 1 ? "" : "s"}
        {planId ? ` · ${planId}` : ""}
        {missingBaseline > 0 ? ` · ${missingBaseline} without baseline` : ""}
        {missingNumericTarget > 0
          ? ` · ${missingNumericTarget} without numeric target`
          : ""}
        . Progress needs baseline + current + numeric target. Use{" "}
        <strong>Use current</strong> for baselines and{" "}
        <strong>Use N</strong> / enter a number for targets (display text is
        labels only).
      </p>
      <div className="staff-kpi-editor-list">
        {kpis.map((kpi) => (
          <EditableKpiCard
            key={kpi.kpi_id}
            clientId={clientId}
            kpi={kpi}
            busy={busyId === kpi.kpi_id}
            onPatch={patchKpi}
          />
        ))}
      </div>
    </div>
  );
}

function MetricObservationRow({
  observation,
  unit,
}: {
  observation: StaffMetricObservation;
  unit: string;
}) {
  const isRange = observation.period_start !== observation.period_end;
  const period = isRange
    ? `${formatDate(observation.period_start)} – ${formatDate(observation.period_end)}`
    : formatDate(observation.period_end);
  const sourceLabel =
    CHANGE_SOURCE_LABELS[observation.change_source] ?? observation.change_source;

  return (
    <li className="staff-obs-row">
      <div className="staff-metric-observation-row">
        <span className="text-md">
          {formatMetricValue(observation.value, unit)}
        </span>
        <span className="small text-body-secondary text-capitalize">{unit}</span>
        <span className="small text-body-secondary">PERIOD {period}</span>
        <span className="small text-body-secondary">
          OBSERVED {formatDate(observation.observed_on)}
        </span>
        <span className="small text-body-secondary">
          RECORDED {formatTimestamp(observation.recorded_at)}
        </span>
        <span className="small text-body-secondary text-truncate">
          {observation.source_document || "Manual entry"}
        </span>
        <span className="badge text-bg-light">SOURCE {sourceLabel}</span>
      </div>
    </li>
  );
}

function MetricObservationsTab({
  clientId,
  active,
}: {
  clientId: string;
  active: boolean;
}) {
  const [kpis, setKpis] = useState<StaffPlanKpiEditorItem[]>([]);
  const [observationsByMetricId, setObservationsByMetricId] = useState<
    Record<string, StaffMetricObservation[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function loadMetricObservations() {
      setLoading(true);
      setError(null);

      try {
        const kpiResponse = await fetch(
          `/api/staff/plan/kpis?client_id=${encodeURIComponent(clientId)}`,
          { cache: "no-store" },
        );
        const kpiBody = (await kpiResponse.json()) as StaffPlanKpiEditorResponse & {
          error?: string;
        };
        if (!kpiResponse.ok) {
          throw new Error(kpiBody.error ?? "Could not load client KPIs");
        }

        const clientMetricIds = kpiBody.kpis
          .map((kpi) => kpi.client_metric_id)
          .filter((id): id is string => Boolean(id));
        let nextObservations: Record<string, StaffMetricObservation[]> = {};

        if (clientMetricIds.length > 0) {
          const observationsResponse = await fetch(
            `/api/staff/plan/observations?client_id=${encodeURIComponent(
              clientId,
            )}&client_metric_ids=${encodeURIComponent(clientMetricIds.join(","))}`,
            { cache: "no-store" },
          );
          const observationsBody =
            (await observationsResponse.json()) as StaffMetricObservationsByMetricResponse & {
              error?: string;
            };
          if (!observationsResponse.ok) {
            throw new Error(
              observationsBody.error ?? "Could not load metric observations",
            );
          }
          nextObservations = observationsBody.observations_by_client_metric_id;
        }

        if (!cancelled) {
          setKpis(kpiBody.kpis);
          setObservationsByMetricId(nextObservations);
        }
      } catch (err) {
        if (!cancelled) {
          setKpis([]);
          setObservationsByMetricId({});
          setError(
            err instanceof Error
              ? err.message
              : "Could not load metric observations",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadMetricObservations();
    return () => {
      cancelled = true;
    };
  }, [active, clientId, reloadToken]);

  if (loading) {
    return (
      <p className="staff-dashboard-muted mb-0">
        Loading metric observations…
      </p>
    );
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
    <div className="staff-metric-observations-list">
      {kpis.map((kpi) => {
        const observations = [
          ...(kpi.client_metric_id
            ? (observationsByMetricId[kpi.client_metric_id] ?? [])
            : []),
        ].sort(
          (a, b) =>
            a.period_end.localeCompare(b.period_end) ||
            a.recorded_at.localeCompare(b.recorded_at),
        );
        const hasBaseline =
          kpi.baseline_established && kpi.baseline_snapshot !== null;
        const hasTarget = kpi.target_value !== null || Boolean(kpi.target);
        const lastObservation = observations.at(-1);
        const target = kpi.target || formatMetricValue(kpi.target_value, kpi.unit);

        return (
          <details className="staff-metric-observations-kpi" key={kpi.kpi_id}>
            <summary>
              <div className="staff-metric-observations-summary-copy">
                <span className="staff-metric-observations-kpi-label">
                  {kpi.label}
                </span>
                <span className="staff-metric-observations-pills">
                  <span className="badge text-bg-light">
                    <span className="staff-metric-observations-pill-label">
                      Observations
                    </span>{" "}
                    {observations.length}
                  </span>
                  <span className="badge text-bg-light">
                    <span className="staff-metric-observations-pill-label">
                      Baseline
                    </span>{" "}
                    {hasBaseline
                      ? formatMetricValue(kpi.baseline_snapshot, kpi.unit)
                      : "—"}
                  </span>
                  <span className="badge text-bg-light">
                    <span className="staff-metric-observations-pill-label">
                      Last observation
                    </span>{" "}
                    {lastObservation
                      ? `${formatMetricValue(
                          lastObservation.value,
                          kpi.unit,
                        )} · ${formatDate(lastObservation.period_end)}`
                      : "—"}
                  </span>
                  <span className="badge text-bg-light">
                    <span className="staff-metric-observations-pill-label">
                      Target
                    </span>{" "}
                    {hasTarget ? target : "—"}
                  </span>
                </span>
              </div>
            </summary>
            <div className="staff-metric-observations-kpi-body">
              {!kpi.client_metric_id ? (
                <p className="small text-body-secondary mb-0">
                  This KPI is not linked to a tracked metric.
                </p>
              ) : observations.length === 0 ? (
                <p className="small text-body-secondary mb-0">
                  No observations recorded yet.
                </p>
              ) : (
                <ul className="staff-obs-list">
                  {observations.map((observation) => (
                    <MetricObservationRow
                      key={observation.id}
                      observation={observation}
                      unit={kpi.unit}
                    />
                  ))}
                </ul>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}

export function StaffClientKpiEditorPanel({
  clientId,
  active,
  onDirty,
}: StaffClientKpiEditorPanelProps) {
  const [tab, setTab] = useState<EditorTab>("plan_kpis");

  return (
    <div>
      <div className="staff-client-detail-tabs-wrap mb-3">
        <ul className="nav nav-tabs staff-client-detail-tabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              type="button"
              id="staff-kpi-editor-tab-plan"
              role="tab"
              aria-selected={tab === "plan_kpis"}
              aria-controls="staff-kpi-editor-tabpanel-plan"
              className={`nav-link${tab === "plan_kpis" ? " active" : ""}`}
              onClick={() => setTab("plan_kpis")}
            >
              Plan KPIs
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              type="button"
              id="staff-kpi-editor-tab-widgets"
              role="tab"
              aria-selected={tab === "dashboard_widgets"}
              aria-controls="staff-kpi-editor-tabpanel-widgets"
              className={`nav-link${tab === "dashboard_widgets" ? " active" : ""}`}
              onClick={() => setTab("dashboard_widgets")}
            >
              Dashboard widgets
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              type="button"
              id="staff-kpi-editor-tab-observations"
              role="tab"
              aria-selected={tab === "metric_observations"}
              aria-controls="staff-kpi-editor-tabpanel-observations"
              className={`nav-link${tab === "metric_observations" ? " active" : ""}`}
              onClick={() => setTab("metric_observations")}
            >
              Metric Observations
            </button>
          </li>
        </ul>
      </div>

      <div
        id="staff-kpi-editor-tabpanel-plan"
        role="tabpanel"
        aria-labelledby="staff-kpi-editor-tab-plan"
        hidden={tab !== "plan_kpis"}
      >
        <PlanKpisTab
          clientId={clientId}
          active={active && tab === "plan_kpis"}
          onDirty={onDirty}
        />
      </div>

      <div
        id="staff-kpi-editor-tabpanel-widgets"
        role="tabpanel"
        aria-labelledby="staff-kpi-editor-tab-widgets"
        hidden={tab !== "dashboard_widgets"}
      >
        <StaffClientDashboardWidgetsPanel
          clientId={clientId}
          active={active && tab === "dashboard_widgets"}
          onDirty={onDirty}
        />
      </div>

      <div
        id="staff-kpi-editor-tabpanel-observations"
        role="tabpanel"
        aria-labelledby="staff-kpi-editor-tab-observations"
        hidden={tab !== "metric_observations"}
      >
        <MetricObservationsTab
          clientId={clientId}
          active={active && tab === "metric_observations"}
        />
      </div>
    </div>
  );
}
