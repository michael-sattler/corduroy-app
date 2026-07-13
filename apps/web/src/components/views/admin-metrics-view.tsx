"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createMetricDefinitionAction,
  deleteMetricDefinitionAction,
  updateMetricDefinitionAction,
} from "@/app/actions/admin";
import { SlidePanel } from "@/components/ui/slide-panel";
import {
  METRIC_CATEGORY_SUGGESTIONS,
  METRIC_FAMILIES,
  METRIC_KINDS,
  METRIC_STOCK_FLOWS,
  METRIC_TIERS,
  METRIC_UNITS,
  METRIC_UPDATE_INTERVALS,
  METRIC_WIDGET_TYPES,
  humanizeMetricValue,
  metricPillClass,
  parseApplicableCcps,
  type MetricClientOption,
  type MetricDefinitionInput,
  type MetricDefinitionRecord,
} from "@/lib/metric-catalog-types";

type AdminMetricsViewProps = {
  metrics: MetricDefinitionRecord[];
  clients: MetricClientOption[];
};

const NEW_ID = "__new__";

const CATEGORY_DATALIST_ID = "metric-category-options";

const EMPTY_DRAFT: MetricDefinitionInput = {
  client_id: null,
  metric_key: "",
  label: "",
  family: null,
  category: null,
  stock_flow: null,
  description: "",
  formula_expression: null,
  tier: "core",
  kind: "observed",
  unit: "count",
  widget_type: "single_stat",
  update_interval: "monthly",
  applicable_ccps: [],
  benchmarkable: true,
  needs_review: false,
};

function Pill({
  facet,
  value,
}: {
  facet: "tier" | "kind" | "family";
  value: string;
}) {
  return (
    <span className={`badge rounded-pill ${metricPillClass(facet, value)}`}>
      {humanizeMetricValue(value)}
    </span>
  );
}

function PillSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="metric-field">
      <span className="form-label small mb-1">{label}</span>
      <select
        className="form-select form-select-sm metric-pill-select"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {humanizeMetricValue(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Like PillSelect but allows an explicit "none" (null) choice. */
function OptionalSelect({
  label,
  value,
  options,
  noneLabel,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string | null;
  options: readonly string[];
  noneLabel: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}) {
  return (
    <label className="metric-field">
      <span className="form-label small mb-1">{label}</span>
      <select
        className="form-select form-select-sm metric-pill-select"
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">{noneLabel}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {humanizeMetricValue(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AdminMetricsView({ metrics, clients }: AdminMetricsViewProps) {
  const [items, setItems] = useState(metrics);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MetricDefinitionInput>(EMPTY_DRAFT);
  const [ccpText, setCcpText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const clientNameById = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients],
  );

  const isNew = editingId === NEW_ID;
  const isLibrary = draft.client_id === null;

  function openNew() {
    setDraft(EMPTY_DRAFT);
    setCcpText("");
    setError(null);
    setEditingId(NEW_ID);
  }

  function openEdit(metric: MetricDefinitionRecord) {
    setDraft({
      client_id: metric.client_id,
      metric_key: metric.metric_key,
      label: metric.label,
      family: metric.family,
      category: metric.category,
      stock_flow: metric.stock_flow,
      description: metric.description,
      formula_expression: metric.formula_expression,
      tier: metric.tier,
      kind: metric.kind,
      unit: metric.unit,
      widget_type: metric.widget_type,
      update_interval: metric.update_interval,
      applicable_ccps: metric.applicable_ccps,
      benchmarkable: metric.benchmarkable,
      needs_review: metric.needs_review,
    });
    setCcpText(metric.applicable_ccps.join(", "));
    setError(null);
    setEditingId(metric.id);
  }

  function patch(next: Partial<MetricDefinitionInput>) {
    setDraft((prev) => ({ ...prev, ...next }));
  }

  function buildRecord(id: string): MetricDefinitionRecord {
    return {
      id,
      client_id: draft.client_id,
      client_name: draft.client_id
        ? (clientNameById.get(draft.client_id) ?? null)
        : null,
      metric_key: draft.metric_key.trim(),
      label: draft.label.trim(),
      family: draft.family,
      category: draft.category,
      stock_flow: draft.kind === "observed" ? draft.stock_flow : null,
      description: draft.description.trim(),
      formula_expression:
        draft.kind === "observed" ? null : draft.formula_expression,
      tier: draft.tier,
      kind: draft.kind,
      unit: draft.unit,
      widget_type: draft.widget_type,
      palette: "default",
      update_interval: draft.update_interval,
      applicable_ccps: draft.applicable_ccps,
      benchmarkable: draft.client_id === null ? draft.benchmarkable : false,
      needs_review: draft.needs_review,
      created_at: new Date().toISOString(),
    };
  }

  function handleSave() {
    const payload: MetricDefinitionInput = {
      ...draft,
      applicable_ccps: parseApplicableCcps(ccpText),
    };
    setError(null);

    startTransition(async () => {
      try {
        if (isNew) {
          const { id } = await createMetricDefinitionAction(payload);
          setDraft(payload);
          setItems((prev) => [buildRecord(id), ...prev]);
        } else if (editingId) {
          await updateMetricDefinitionAction(editingId, payload);
          setDraft(payload);
          const updated = buildRecord(editingId);
          setItems((prev) =>
            prev.map((m) =>
              m.id === editingId
                ? { ...updated, created_at: m.created_at }
                : m,
            ),
          );
        }
        setEditingId(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  function handleDelete(metric: MetricDefinitionRecord) {
    if (
      !window.confirm(
        `Delete metric "${metric.label}" (${metric.metric_key})? This cannot be undone.`,
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteMetricDefinitionAction(metric.id);
        setItems((prev) => prev.filter((m) => m.id !== metric.id));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  const editing = !isNew ? items.find((m) => m.id === editingId) ?? null : null;

  return (
    <>
      <div className="d-flex flex-column gap-4">
        <div className="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h1 className="h4 mb-1">Metric catalog</h1>
            <p className="text-body-secondary mb-0">
              The Corduroy library of universal KPIs plus client-specific
              (bespoke) metrics. Library metrics have no client and are shared
              across every engagement.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm flex-shrink-0"
            onClick={openNew}
          >
            New metric
          </button>
        </div>

        {error ? (
          <div className="alert alert-warning py-2 small mb-0">{error}</div>
        ) : null}

        <div className="app-card p-0 overflow-hidden">
          <table className="table table-hover mb-0 admin-data-table align-middle">
            <thead>
              <tr>
                <th>Metric</th>
                <th>Tier</th>
                <th>Kind</th>
                <th>Category</th>
                <th>Family</th>
                <th>Unit</th>
                <th>Interval</th>
                <th>Scope</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-body-secondary py-4 text-center">
                    No metrics yet. Create the first library definition.
                  </td>
                </tr>
              ) : (
                items.map((metric) => (
                  <tr key={metric.id}>
                    <td>
                      <div className="fw-medium">{metric.label}</div>
                      <div className="small text-body-secondary font-monospace">
                        {metric.metric_key}
                      </div>
                    </td>
                    <td>
                      <Pill facet="tier" value={metric.tier} />
                    </td>
                    <td>
                      <Pill facet="kind" value={metric.kind} />
                    </td>
                    <td className="small">
                      {metric.category ?? (
                        <span className="text-body-secondary">—</span>
                      )}
                    </td>
                    <td>
                      {metric.family ? (
                        <Pill facet="family" value={metric.family} />
                      ) : (
                        <span className="text-body-secondary small">—</span>
                      )}
                    </td>
                    <td className="small">{humanizeMetricValue(metric.unit)}</td>
                    <td className="small">
                      {humanizeMetricValue(metric.update_interval)}
                    </td>
                    <td className="small">
                      {metric.client_id ? (
                        metric.client_name ?? "Client"
                      ) : (
                        <span className="text-body-secondary">Library</span>
                      )}
                    </td>
                    <td className="text-end text-nowrap">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary me-1"
                        onClick={() => openEdit(metric)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(metric)}
                        disabled={pending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SlidePanel
        open={editingId !== null}
        onClose={() => setEditingId(null)}
        title={isNew ? "New metric" : (editing?.label ?? "Edit metric")}
        subtitle={isNew ? "Add a catalog definition" : editing?.metric_key}
        size="lg"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSave();
          }}
        >
          <div className="row g-3">
            <div className="col-sm-6">
              <label className="metric-field">
                <span className="form-label small mb-1">Metric key</span>
                <input
                  className="form-control form-control-sm font-monospace"
                  value={draft.metric_key}
                  onChange={(event) => patch({ metric_key: event.target.value })}
                  placeholder="gross_margin_pct"
                  required
                />
              </label>
            </div>
            <div className="col-sm-6">
              <label className="metric-field">
                <span className="form-label small mb-1">Label</span>
                <input
                  className="form-control form-control-sm"
                  value={draft.label}
                  onChange={(event) => patch({ label: event.target.value })}
                  placeholder="Gross Margin %"
                  required
                />
              </label>
            </div>

            <div className="col-sm-6">
              <PillSelect
                label="Tier"
                value={draft.tier}
                options={METRIC_TIERS}
                onChange={(value) => patch({ tier: value })}
              />
            </div>
            <div className="col-sm-6">
              <PillSelect
                label="Kind"
                value={draft.kind}
                options={METRIC_KINDS}
                onChange={(value) => patch({ kind: value })}
              />
            </div>

            <div className="col-sm-6">
              <label className="metric-field">
                <span className="form-label small mb-1">Category</span>
                <input
                  className="form-control form-control-sm"
                  list={CATEGORY_DATALIST_ID}
                  value={draft.category ?? ""}
                  onChange={(event) =>
                    patch({ category: event.target.value || null })
                  }
                  placeholder="Financial"
                />
                <datalist id={CATEGORY_DATALIST_ID}>
                  {METRIC_CATEGORY_SUGGESTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              </label>
            </div>
            <div className="col-sm-6">
              <OptionalSelect
                label="Family"
                value={draft.family}
                options={METRIC_FAMILIES}
                noneLabel="None"
                onChange={(value) => patch({ family: value })}
              />
            </div>

            <div className="col-sm-6">
              <PillSelect
                label="Unit"
                value={draft.unit}
                options={METRIC_UNITS}
                onChange={(value) => patch({ unit: value })}
              />
            </div>
            <div className="col-sm-6">
              {draft.kind === "observed" ? (
                <OptionalSelect
                  label="Stock / flow"
                  value={draft.stock_flow}
                  options={METRIC_STOCK_FLOWS}
                  noneLabel="Not set"
                  onChange={(value) => patch({ stock_flow: value })}
                />
              ) : (
                <label className="metric-field">
                  <span className="form-label small mb-1">Formula</span>
                  <input
                    className="form-control form-control-sm font-monospace"
                    value={draft.formula_expression ?? ""}
                    onChange={(event) =>
                      patch({ formula_expression: event.target.value || null })
                    }
                    placeholder="total_revenue - total_cogs"
                  />
                </label>
              )}
            </div>

            <div className="col-sm-6">
              <PillSelect
                label="Widget type"
                value={draft.widget_type}
                options={METRIC_WIDGET_TYPES}
                onChange={(value) => patch({ widget_type: value })}
              />
            </div>
            <div className="col-sm-6">
              <PillSelect
                label="Update interval"
                value={draft.update_interval}
                options={METRIC_UPDATE_INTERVALS}
                onChange={(value) => patch({ update_interval: value })}
              />
            </div>

            <div className="col-12">
              <label className="metric-field">
                <span className="form-label small mb-1">Description</span>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  value={draft.description}
                  onChange={(event) =>
                    patch({ description: event.target.value })
                  }
                  placeholder="What this metric measures and how to scope it."
                />
              </label>
            </div>

            <div className="col-sm-6">
              <label className="metric-field">
                <span className="form-label small mb-1">Scope</span>
                <select
                  className="form-select form-select-sm metric-pill-select"
                  value={draft.client_id ?? ""}
                  onChange={(event) =>
                    patch({
                      client_id: event.target.value || null,
                      benchmarkable: event.target.value
                        ? false
                        : draft.benchmarkable,
                    })
                  }
                >
                  <option value="">Library (all clients)</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="col-sm-6">
              <label className="metric-field">
                <span className="form-label small mb-1">
                  Applicable CCPs (swap slots)
                </span>
                <input
                  className="form-control form-control-sm font-monospace"
                  value={ccpText}
                  onChange={(event) => setCcpText(event.target.value)}
                  placeholder="e.g. 3, 4, 5"
                />
              </label>
            </div>

            <div className="col-12 d-flex flex-wrap gap-4 pt-1">
              <div className="form-check">
                <input
                  id="metric-benchmarkable"
                  type="checkbox"
                  className="form-check-input"
                  checked={isLibrary && draft.benchmarkable}
                  disabled={!isLibrary}
                  onChange={(event) =>
                    patch({ benchmarkable: event.target.checked })
                  }
                />
                <label
                  className="form-check-label small"
                  htmlFor="metric-benchmarkable"
                >
                  Benchmarkable
                  {!isLibrary ? " (library metrics only)" : ""}
                </label>
              </div>
              <div className="form-check">
                <input
                  id="metric-needs-review"
                  type="checkbox"
                  className="form-check-input"
                  checked={draft.needs_review}
                  onChange={(event) =>
                    patch({ needs_review: event.target.checked })
                  }
                />
                <label
                  className="form-check-label small"
                  htmlFor="metric-needs-review"
                >
                  Needs review
                </label>
              </div>
            </div>
          </div>

          <div className="slide-panel-footer">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setEditingId(null)}
              disabled={pending}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending}>
              {pending ? "Saving…" : isNew ? "Create metric" : "Save metric"}
            </button>
          </div>
        </form>
      </SlidePanel>
    </>
  );
}
