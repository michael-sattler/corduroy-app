"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { recordMetricObservationAction } from "@/app/actions/admin";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import {
  isManuallyObservable,
  requiresPeriodRange,
  validateObservationInput,
} from "@/lib/metrics/observation-rules";
import type { StaffPlanDashboardKpi } from "@/lib/plan/staff-plan-dashboard-types";
import type {
  StaffMetricObservation,
  StaffMetricObservationsResponse,
} from "@/lib/plan/staff-metric-observations-types";

type StaffKpiObservationPanelProps = {
  clientId: string;
  kpi: StaffPlanDashboardKpi;
  onRecorded: () => void;
  onCancel: () => void;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

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

const CHANGE_SOURCE_LABELS: Record<string, string> = {
  manual_advisor: "Advisor",
  manual_client: "Client",
  agent_ingest: "AI",
  connector_sync: "Connector",
  reconciliation: "Reconciliation",
};

const UNIT_HINTS: Record<string, string> = {
  currency: "Enter the amount in dollars (e.g. 125000).",
  percent: "Enter a percentage 0–100 (e.g. 42.5).",
  count: "Enter a whole number.",
  days: "Enter a number of days.",
  months: "Enter a number of months.",
  ratio: "Enter a ratio (e.g. 0.35).",
};

function ObservationRow({
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
      <div className="d-flex justify-content-between align-items-baseline gap-2">
        <span className="fw-medium">
          {formatMetricValue(observation.value, unit)}
        </span>
        <span className="small text-body-secondary">{period}</span>
      </div>
      <div className="d-flex justify-content-between align-items-baseline gap-2">
        <span className="small text-body-secondary text-truncate">
          {observation.source_document || "No source noted"}
        </span>
        <span className="badge text-bg-light flex-shrink-0">{sourceLabel}</span>
      </div>
    </li>
  );
}

export function StaffKpiObservationPanel({
  clientId,
  kpi,
  onRecorded,
  onCancel,
}: StaffKpiObservationPanelProps) {
  const isFlow = requiresPeriodRange(kpi.stock_flow);
  const observable = isManuallyObservable(kpi.definition_kind);
  const clientMetricId = kpi.client_metric_id;

  const [value, setValue] = useState("");
  const [periodEnd, setPeriodEnd] = useState(today);
  const [periodStart, setPeriodStart] = useState(today);
  const [sourceDocument, setSourceDocument] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [observations, setObservations] = useState<StaffMetricObservation[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadObservations = useCallback(async () => {
    if (!clientMetricId || !observable) return;
    setListLoading(true);
    setListError(null);
    try {
      const res = await fetch(
        `/api/staff/plan/observations?client_id=${encodeURIComponent(
          clientId,
        )}&client_metric_id=${encodeURIComponent(clientMetricId)}`,
        { cache: "no-store" },
      );
      const body = (await res.json()) as StaffMetricObservationsResponse & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "Could not load observations");
      }
      setObservations(body.observations);
    } catch (err) {
      setListError(
        err instanceof Error ? err.message : "Could not load observations",
      );
    } finally {
      setListLoading(false);
    }
  }, [clientId, clientMetricId, observable]);

  useEffect(() => {
    void loadObservations();
  }, [loadObservations]);

  const preview = useMemo(
    () =>
      validateObservationInput(
        {
          kind: kpi.definition_kind,
          unit: kpi.unit,
          stock_flow: kpi.stock_flow,
        },
        { value, periodStart, periodEnd, sourceDocument },
      ),
    [kpi, value, periodStart, periodEnd, sourceDocument],
  );

  const warnings = preview.warnings;
  const canSubmit = value.trim() !== "" && !pending;

  if (!observable) {
    return (
      <div>
        <div className="alert alert-secondary mb-0" role="alert">
          <div className="fw-medium mb-1">{kpi.label}</div>
          <p className="mb-0 small">
            This is a <strong>{kpi.definition_kind}</strong> metric — it is
            computed from other observed inputs, so it can&apos;t be recorded
            directly. Observe its input metrics instead.
          </p>
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!clientMetricId) {
    return (
      <div>
        <div className="alert alert-warning mb-0" role="alert">
          This KPI isn&apos;t linked to a tracked client metric yet, so there is
          nothing to record against.
        </div>
        <div className="d-flex justify-content-end mt-3">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={onCancel}
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  function handleSubmit() {
    if (!clientMetricId) return;
    if (!preview.ok) {
      setError(preview.errors.join(" "));
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        await recordMetricObservationAction({
          clientMetricId,
          value,
          periodStart,
          periodEnd,
          sourceDocument,
        });
        setValue("");
        setSourceDocument("");
        await loadObservations();
        onRecorded();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Could not record observation",
        );
      }
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <dl className="row g-0 small mb-3">
        <dt className="col-5 text-body-secondary fw-normal">Current value</dt>
        <dd className="col-7 mb-1">
          {formatMetricValue(kpi.current_value, kpi.unit)}
        </dd>
        <dt className="col-5 text-body-secondary fw-normal">Target</dt>
        <dd className="col-7 mb-1">{kpi.target || "—"}</dd>
        <dt className="col-5 text-body-secondary fw-normal">Cadence</dt>
        <dd className="col-7 mb-0 text-capitalize">{kpi.review_cadence}</dd>
      </dl>

      <div className="mb-3">
        <label className="form-label small mb-1" htmlFor="obs-value">
          New value
        </label>
        <input
          id="obs-value"
          className="form-control"
          inputMode="decimal"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="0"
          autoFocus
          required
        />
        <div className="form-text">
          {UNIT_HINTS[kpi.unit] ?? "Enter a numeric value."}
        </div>
      </div>

      {isFlow ? (
        <div className="row g-2 mb-3">
          <div className="col-6">
            <label className="form-label small mb-1" htmlFor="obs-start">
              Period start
            </label>
            <input
              id="obs-start"
              type="date"
              className="form-control"
              value={periodStart}
              max={periodEnd || today()}
              onChange={(event) => setPeriodStart(event.target.value)}
              required
            />
          </div>
          <div className="col-6">
            <label className="form-label small mb-1" htmlFor="obs-end">
              Period end
            </label>
            <input
              id="obs-end"
              type="date"
              className="form-control"
              value={periodEnd}
              max={today()}
              onChange={(event) => setPeriodEnd(event.target.value)}
              required
            />
          </div>
          <div className="col-12 form-text mt-0">
            Flow metric — the window this value accrued over.
          </div>
        </div>
      ) : (
        <div className="mb-3">
          <label className="form-label small mb-1" htmlFor="obs-asof">
            As of date
          </label>
          <input
            id="obs-asof"
            type="date"
            className="form-control"
            value={periodEnd}
            max={today()}
            onChange={(event) => setPeriodEnd(event.target.value)}
            required
          />
          <div className="form-text">
            Stock metric — the point in time this reading reflects.
          </div>
        </div>
      )}

      <div className="mb-3">
        <label className="form-label small mb-1" htmlFor="obs-source">
          Source document
        </label>
        <input
          id="obs-source"
          className="form-control"
          value={sourceDocument}
          onChange={(event) => setSourceDocument(event.target.value)}
          placeholder="e.g. QBO export, client email 2026-07-10"
        />
        <div className="form-text">Where this number came from.</div>
      </div>

      {warnings.length > 0 ? (
        <div className="alert alert-warning py-2 small mb-3" role="alert">
          <ul className="mb-0 ps-3">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {error ? (
        <div className="alert alert-danger py-2 small mb-3" role="alert">
          {error}
        </div>
      ) : null}

      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={pending}
        >
          Close
        </button>
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {pending ? "Recording…" : "Record observation"}
        </button>
      </div>

      <hr className="my-3" />

      <div>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h3 className="h6 mb-0">Recent observations</h3>
          {listLoading ? (
            <span className="small text-body-secondary">Loading…</span>
          ) : null}
        </div>

        {listError ? (
          <div className="alert alert-danger py-2 small mb-0" role="alert">
            {listError}
          </div>
        ) : observations.length === 0 && !listLoading ? (
          <p className="small text-body-secondary mb-0">
            No observations recorded yet.
          </p>
        ) : (
          <ul className="staff-obs-list">
            {observations.map((observation) => (
              <ObservationRow
                key={observation.id}
                observation={observation}
                unit={kpi.unit}
              />
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
