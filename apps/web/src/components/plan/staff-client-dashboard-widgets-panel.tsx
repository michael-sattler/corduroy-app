"use client";

import { useEffect, useMemo, useState } from "react";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faArrowDown, faArrowUp } from "@/lib/fontawesome-icons";
import {
  METRIC_WIDGET_TYPES,
  humanizeMetricValue,
} from "@/lib/metric-catalog-types";
import { formatMetricValue } from "@/lib/plan/staff-plan-dashboard-format";
import type {
  StaffClientMetricOption,
  StaffDashboardWidgetEditorItem,
  StaffDashboardWidgetsResponse,
} from "@/lib/widgets/staff-dashboard-widgets-types";

const UNASSIGNED = "";

type StaffClientDashboardWidgetsPanelProps = {
  clientId: string;
  active: boolean;
  /** Fired once when the staff changes an assignment (kind / visibility / order). */
  onDirty?: () => void;
};

type MetricRow = {
  metric: StaffClientMetricOption;
  /** Primary widget for this metric (lowest sort_order), if any. */
  widget: StaffDashboardWidgetEditorItem | null;
  extraCount: number;
};

export function StaffClientDashboardWidgetsPanel({
  clientId,
  active,
  onDirty,
}: StaffClientDashboardWidgetsPanelProps) {
  const [widgets, setWidgets] = useState<StaffDashboardWidgetEditorItem[]>([]);
  const [clientMetrics, setClientMetrics] = useState<StaffClientMetricOption[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyMetricId, setBusyMetricId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  function markDirty() {
    onDirty?.();
  }

  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/staff/dashboard-widgets?client_id=${encodeURIComponent(clientId)}`,
          { cache: "no-store" },
        );
        const body = (await res.json()) as StaffDashboardWidgetsResponse & {
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "Could not load dashboard widgets");
        }
        if (!cancelled) {
          setWidgets(body.widgets);
          setClientMetrics(body.client_metrics);
        }
      } catch (err) {
        if (!cancelled) {
          setWidgets([]);
          setClientMetrics([]);
          setError(
            err instanceof Error
              ? err.message
              : "Could not load dashboard widgets",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [clientId, active, reloadToken]);

  const rows = useMemo((): MetricRow[] => {
    const byMetric = new Map<string, StaffDashboardWidgetEditorItem[]>();
    for (const widget of widgets) {
      const list = byMetric.get(widget.client_metric_id) ?? [];
      list.push(widget);
      byMetric.set(widget.client_metric_id, list);
    }

    const mapped = clientMetrics.map((metric) => {
      const list = (byMetric.get(metric.id) ?? []).slice().sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return a.id.localeCompare(b.id);
      });
      return {
        metric,
        widget: list[0] ?? null,
        extraCount: Math.max(0, list.length - 1),
      };
    });

    // Assigned first (by dashboard order), then unassigned A–Z.
    return mapped.sort((a, b) => {
      const aAssigned = a.widget !== null;
      const bAssigned = b.widget !== null;
      if (aAssigned !== bAssigned) return aAssigned ? -1 : 1;
      if (aAssigned && bAssigned && a.widget && b.widget) {
        if (a.widget.sort_order !== b.widget.sort_order) {
          return a.widget.sort_order - b.widget.sort_order;
        }
      }
      return a.metric.label.localeCompare(b.metric.label);
    });
  }, [clientMetrics, widgets]);

  const assignedRows = useMemo(
    () => rows.filter((row) => row.widget !== null),
    [rows],
  );
  const assignedCount = assignedRows.length;

  async function assignKind(metric: StaffClientMetricOption, kind: string) {
    setBusyMetricId(metric.id);
    setError(null);

    const existing = widgets
      .filter((w) => w.client_metric_id === metric.id)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order);

    try {
      if (kind === UNASSIGNED) {
        for (const widget of existing) {
          const res = await fetch("/api/staff/dashboard-widgets", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client_id: clientId, id: widget.id }),
          });
          const body = (await res.json()) as { error?: string };
          if (!res.ok) {
            throw new Error(body.error ?? "Could not unassign widget");
          }
        }
        setWidgets((prev) =>
          prev.filter((w) => w.client_metric_id !== metric.id),
        );
        markDirty();
        return;
      }

      if (existing.length === 0) {
        const res = await fetch("/api/staff/dashboard-widgets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: clientId,
            client_metric_id: metric.id,
            widget_type: kind,
          }),
        });
        const body = (await res.json()) as {
          widget?: StaffDashboardWidgetEditorItem;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(body.error ?? "Could not assign widget");
        }
        if (!body.widget) {
          throw new Error("Could not assign widget (empty response)");
        }
        setWidgets((prev) => [...prev, body.widget!]);
        markDirty();
        return;
      }

      const primary = existing[0];
      const res = await fetch("/api/staff/dashboard-widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          id: primary.id,
          patch: { widget_type: kind, is_visible: true },
        }),
      });
      const body = (await res.json()) as {
        widget?: StaffDashboardWidgetEditorItem;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "Could not update widget");
      }
      if (!body.widget) {
        throw new Error("Could not update widget (empty response)");
      }
      setWidgets((prev) =>
        prev.map((row) => (row.id === primary.id ? body.widget! : row)),
      );
      markDirty();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update assignment",
      );
      setReloadToken((t) => t + 1);
    } finally {
      setBusyMetricId(null);
    }
  }

  async function toggleVisible(widget: StaffDashboardWidgetEditorItem) {
    setBusyMetricId(widget.client_metric_id);
    setError(null);
    try {
      const res = await fetch("/api/staff/dashboard-widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          id: widget.id,
          patch: { is_visible: !widget.is_visible },
        }),
      });
      const body = (await res.json()) as {
        widget?: StaffDashboardWidgetEditorItem;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "Could not update visibility");
      }
      if (body.widget) {
        setWidgets((prev) =>
          prev.map((row) => (row.id === widget.id ? body.widget! : row)),
        );
        markDirty();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update visibility",
      );
    } finally {
      setBusyMetricId(null);
    }
  }

  async function reorderAssigned(
    widget: StaffDashboardWidgetEditorItem,
    direction: "up" | "down",
  ) {
    setBusyMetricId(widget.client_metric_id);
    setError(null);
    try {
      const res = await fetch("/api/staff/dashboard-widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          id: widget.id,
          direction,
        }),
      });
      const body = (await res.json()) as {
        widgets?: StaffDashboardWidgetEditorItem[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(body.error ?? "Could not reorder widget");
      }
      if (body.widgets) {
        setWidgets(body.widgets);
        markDirty();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reorder widget");
    } finally {
      setBusyMetricId(null);
    }
  }

  if (loading) {
    return (
      <p className="staff-dashboard-muted mb-0">Loading dashboard widgets…</p>
    );
  }

  if (clientMetrics.length === 0) {
    return (
      <p className="staff-dashboard-muted mb-0">
        No client metrics exist for this client yet. Widgets are assigned from
        client metrics (not plan KPIs).
      </p>
    );
  }

  return (
    <div>
      {error ? (
        <div className="alert alert-danger mb-2" role="alert">
          {error}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary ms-2"
            onClick={() => setReloadToken((t) => t + 1)}
          >
            Retry
          </button>
        </div>
      ) : null}

      <p className="small text-body-secondary mb-2">
        {assignedCount} of {clientMetrics.length} metric
        {clientMetrics.length === 1 ? "" : "s"} on the dashboard. The kind
        dropdown shows the current assignment — change it anytime, or choose
        &ldquo;Not on dashboard&rdquo; to remove.
      </p>

      <div className="staff-widget-metric-list">
        {rows.map(({ metric, widget, extraCount }) => {
          const busy = busyMetricId === metric.id;
          const assigned = widget !== null;
          const assignedIndex = assigned
            ? assignedRows.findIndex((row) => row.metric.id === metric.id)
            : -1;
          const kindLabel = assigned
            ? humanizeMetricValue(widget.widget_type)
            : "Not on dashboard";

          return (
            <div
              key={metric.id}
              className={`staff-widget-metric-row${
                assigned ? " is-assigned" : ""
              }${metric.is_active ? "" : " is-inactive"}`}
            >
              <div className="staff-widget-metric-main min-w-0">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <div className="staff-widget-metric-title text-truncate">
                    {metric.label}
                    {!metric.is_active ? (
                      <span className="text-body-secondary"> · inactive</span>
                    ) : null}
                  </div>
                  <span
                    className={`staff-widget-kind-badge${
                      assigned ? " is-assigned" : ""
                    }`}
                  >
                    {kindLabel}
                  </span>
                  {assigned && widget && !widget.is_visible ? (
                    <span className="staff-widget-kind-badge is-hidden">
                      Hidden
                    </span>
                  ) : null}
                </div>
                <div className="staff-widget-metric-meta">
                  {metric.metric_key} ·{" "}
                  {formatMetricValue(
                    widget?.current_value ?? null,
                    metric.unit,
                  )}
                  {extraCount > 0 ? (
                    <span className="text-body-secondary">
                      {" "}
                      · +{extraCount} more tile
                      {extraCount === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="staff-widget-metric-controls">
                {assigned && widget ? (
                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      title="Move up on dashboard"
                      disabled={busy || assignedIndex <= 0}
                      onClick={() => void reorderAssigned(widget, "up")}
                    >
                      <FontAwesomeIcon icon={faArrowUp} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      title="Move down on dashboard"
                      disabled={
                        busy ||
                        assignedIndex < 0 ||
                        assignedIndex >= assignedCount - 1
                      }
                      onClick={() => void reorderAssigned(widget, "down")}
                    >
                      <FontAwesomeIcon icon={faArrowDown} />
                    </button>
                  </div>
                ) : null}

                <div className="staff-widget-kind-field">
                  <label
                    className="staff-kpi-editor-label mb-1"
                    htmlFor={`kind-${metric.id}`}
                  >
                    Display kind
                  </label>
                  <select
                    id={`kind-${metric.id}`}
                    className={`form-select form-select-sm staff-widget-kind-select${
                      assigned ? " is-assigned" : ""
                    }`}
                    value={widget?.widget_type ?? UNASSIGNED}
                    disabled={busy}
                    onChange={(e) => void assignKind(metric, e.target.value)}
                  >
                    <option value={UNASSIGNED}>Not on dashboard</option>
                    {METRIC_WIDGET_TYPES.map((kind) => (
                      <option key={kind} value={kind}>
                        {humanizeMetricValue(kind)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-check form-switch mb-0 staff-widget-visible-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id={`visible-${metric.id}`}
                    checked={widget?.is_visible ?? false}
                    disabled={busy || !assigned}
                    onChange={() => {
                      if (widget) void toggleVisible(widget);
                    }}
                  />
                  <label
                    className="form-check-label small"
                    htmlFor={`visible-${metric.id}`}
                  >
                    {assigned
                      ? widget?.is_visible
                        ? "Shown"
                        : "Hidden"
                      : "Shown"}
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
