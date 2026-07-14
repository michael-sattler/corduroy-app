"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@/lib/fontawesome";
import { faPen } from "@/lib/fontawesome-icons";
import { planStatusTone } from "@/lib/plan/staff-plan-dashboard-format";
import {
  updatePlanGoal,
  updatePlanInitiative,
} from "@/lib/plan/staff-plan-structure-client";
import {
  GOAL_PRIORITIES,
  INITIATIVE_OWNERS,
  INITIATIVE_STATUSES,
  type StaffPlanGoalItem,
  type StaffPlanInitiativeItem,
  type StaffPlanStructureResponse,
} from "@/lib/plan/staff-plan-structure-types";

type StaffClientPlanStructurePanelProps = {
  clientId: string;
  active: boolean;
  section?: "initiatives" | "goals" | "both";
};

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

function formatBudget(value: number | null): string {
  if (value === null) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function titleCase(value: string): string {
  return value.replace(/_/g, " ");
}

function InitiativeCard({
  clientId,
  initiative,
  onSaved,
}: {
  clientId: string;
  initiative: StaffPlanInitiativeItem;
  onSaved: (updated: StaffPlanInitiativeItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState(initiative.label);
  const [successCriteria, setSuccessCriteria] = useState(
    initiative.success_criteria,
  );
  const [budget, setBudget] = useState(
    initiative.budget_usd === null ? "" : String(initiative.budget_usd),
  );
  const [status, setStatus] = useState(initiative.status);
  const [owner, setOwner] = useState(initiative.owner);

  function startEdit() {
    setLabel(initiative.label);
    setSuccessCriteria(initiative.success_criteria);
    setBudget(initiative.budget_usd === null ? "" : String(initiative.budget_usd));
    setStatus(initiative.status);
    setOwner(initiative.owner);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const result = await updatePlanInitiative(clientId, initiative.initiative_id, {
        label,
        success_criteria: successCriteria,
        budget_usd: budget.trim() === "" ? null : Number(budget),
        status,
        owner,
      });
      onSaved({ ...initiative, ...result });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save initiative");
    } finally {
      setSaving(false);
    }
  }

  const tone = planStatusTone(initiative.status);

  return (
    <div className={`staff-structure-card status-${initiative.status}`}>
      <div className="staff-structure-card-main">
        <div className="staff-structure-card-head">
          {editing ? (
            <input
              className="form-control form-control-sm staff-structure-input-title"
              value={label}
              disabled={saving}
              onChange={(event) => setLabel(event.target.value)}
              aria-label="Initiative label"
            />
          ) : (
            <>
              <span className="staff-structure-title">{initiative.label}</span>
              <span className="staff-structure-id">{initiative.initiative_id}</span>
            </>
          )}
        </div>

        {editing ? (
          <>
            <label className="staff-structure-edit-field">
              <span className="staff-kpi-editor-label">Success criteria</span>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={successCriteria}
                disabled={saving}
                onChange={(event) => setSuccessCriteria(event.target.value)}
              />
            </label>
            <label className="staff-structure-edit-field">
              <span className="staff-kpi-editor-label">Budget (USD)</span>
              <input
                type="number"
                min={0}
                step={100}
                className="form-control form-control-sm"
                value={budget}
                disabled={saving}
                placeholder="—"
                onChange={(event) => setBudget(event.target.value)}
              />
            </label>
          </>
        ) : (
          <p className="staff-structure-body mb-0">
            {initiative.success_criteria || "No success criteria recorded."}
          </p>
        )}
      </div>

      <div className="staff-structure-card-meta">
        {editing ? (
          <>
            <label className="staff-structure-edit-field w-100">
              <span className="staff-kpi-editor-label">Status</span>
              <select
                className={`form-select form-select-sm staff-structure-pill-select staff-status-select ${planStatusTone(status)}`}
                value={status}
                disabled={saving}
                onChange={(event) => setStatus(event.target.value)}
              >
                {INITIATIVE_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            </label>
            <label className="staff-structure-edit-field w-100">
              <span className="staff-kpi-editor-label">Owner</span>
              <select
                className="form-select form-select-sm staff-structure-pill-select"
                value={owner}
                disabled={saving}
                onChange={(event) => setOwner(event.target.value)}
              >
                {INITIATIVE_OWNERS.map((option) => (
                  <option key={option} value={option}>
                    {titleCase(option)}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <span className={`badge staff-milestone-badge ${tone}`}>
              {titleCase(initiative.status)}
            </span>
            <span className="staff-structure-meta-line">
              <span className="staff-kpi-editor-label">Owner</span>
              <span className="text-capitalize">{initiative.owner}</span>
            </span>
            <span className="staff-structure-meta-line">
              <span className="staff-kpi-editor-label">Budget</span>
              <span>{formatBudget(initiative.budget_usd)}</span>
            </span>
            <span className="staff-structure-meta-line">
              <span className="staff-kpi-editor-label">Last activity</span>
              <span>{formatDateTime(initiative.last_activity_at)}</span>
            </span>
          </>
        )}
      </div>

      <StructureCardActions
        editing={editing}
        saving={saving}
        error={error}
        onEdit={startEdit}
        onSave={() => void save()}
        onCancel={() => {
          setEditing(false);
          setError(null);
        }}
        ariaLabel="Edit initiative"
      />
    </div>
  );
}

function GoalCard({
  clientId,
  goal,
  onSaved,
}: {
  clientId: string;
  goal: StaffPlanGoalItem;
  onSaved: (updated: StaffPlanGoalItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [label, setLabel] = useState(goal.label);
  const [description, setDescription] = useState(goal.description);
  const [target, setTarget] = useState(goal.target);
  const [priority, setPriority] = useState(goal.priority);

  function startEdit() {
    setLabel(goal.label);
    setDescription(goal.description);
    setTarget(goal.target);
    setPriority(goal.priority);
    setError(null);
    setEditing(true);
  }

  async function save() {
    setSaving(true);
    setError(null);

    try {
      const result = await updatePlanGoal(clientId, goal.goal_id, {
        label,
        description,
        target,
        priority,
      });
      onSaved({ ...goal, ...result });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save goal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="staff-structure-card">
      <div className="staff-structure-card-main">
        <div className="staff-structure-card-head">
          {editing ? (
            <input
              className="form-control form-control-sm staff-structure-input-title"
              value={label}
              disabled={saving}
              onChange={(event) => setLabel(event.target.value)}
              aria-label="Goal label"
            />
          ) : (
            <>
              <span className="staff-structure-title">{goal.label}</span>
              <span className="staff-structure-id">{goal.goal_id}</span>
            </>
          )}
        </div>

        {editing ? (
          <>
            <label className="staff-structure-edit-field">
              <span className="staff-kpi-editor-label">Description</span>
              <textarea
                className="form-control form-control-sm"
                rows={2}
                value={description}
                disabled={saving}
                onChange={(event) => setDescription(event.target.value)}
              />
            </label>
            <label className="staff-structure-edit-field">
              <span className="staff-kpi-editor-label">Target</span>
              <input
                className="form-control form-control-sm"
                value={target}
                disabled={saving}
                onChange={(event) => setTarget(event.target.value)}
              />
            </label>
          </>
        ) : (
          <>
            <p className="staff-structure-body mb-0">
              {goal.description || "No description recorded."}
            </p>
            {goal.target ? (
              <p className="staff-structure-target mb-0">
                <span className="staff-kpi-editor-label">Target</span> {goal.target}
              </p>
            ) : null}
          </>
        )}
      </div>

      <div className="staff-structure-card-meta">
        {editing ? (
          <label className="staff-structure-edit-field w-100">
            <span className="staff-kpi-editor-label">Priority</span>
            <select
              className="form-select form-select-sm staff-structure-pill-select"
              value={priority}
              disabled={saving}
              onChange={(event) => setPriority(Number(event.target.value))}
            >
              {GOAL_PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <span className="badge text-bg-light border">
            Priority {goal.priority}
          </span>
        )}
        <span className="staff-structure-meta-line">
          <span className="staff-kpi-editor-label">Last data update</span>
          <span>{formatDateTime(goal.last_metric_update_at)}</span>
        </span>
      </div>

      <StructureCardActions
        editing={editing}
        saving={saving}
        error={error}
        onEdit={startEdit}
        onSave={() => void save()}
        onCancel={() => {
          setEditing(false);
          setError(null);
        }}
        ariaLabel="Edit goal"
      />
    </div>
  );
}

function StructureCardActions({
  editing,
  saving,
  error,
  onEdit,
  onSave,
  onCancel,
  ariaLabel,
}: {
  editing: boolean;
  saving: boolean;
  error: string | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  ariaLabel: string;
}) {
  return (
    <div className="staff-structure-card-actions">
      {editing ? (
        <>
          <button
            type="button"
            className="btn btn-sm btn-primary"
            disabled={saving}
            onClick={onSave}
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            disabled={saving}
            onClick={onCancel}
          >
            Cancel
          </button>
          {error ? (
            <span className="staff-structure-card-error small text-danger">
              {error}
            </span>
          ) : null}
        </>
      ) : (
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary staff-structure-edit-btn"
          onClick={onEdit}
          aria-label={ariaLabel}
          title={ariaLabel}
        >
          <FontAwesomeIcon icon={faPen} />
        </button>
      )}
    </div>
  );
}

export function StaffClientPlanStructurePanel({
  clientId,
  active,
  section = "both",
}: StaffClientPlanStructurePanelProps) {
  const [data, setData] = useState<StaffPlanStructureResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;

    async function loadStructure() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/staff/plan/structure?client_id=${encodeURIComponent(clientId)}`,
          { cache: "no-store" },
        );
        const body = (await res.json()) as StaffPlanStructureResponse & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(body.error ?? "Could not load plan structure");
        }

        if (!cancelled) {
          setData(body);
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setError(
            err instanceof Error ? err.message : "Could not load plan structure",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadStructure();

    return () => {
      cancelled = true;
    };
  }, [clientId, active, reloadToken]);

  function applyInitiative(updated: StaffPlanInitiativeItem) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            initiatives: prev.initiatives.map((item) =>
              item.initiative_id === updated.initiative_id ? updated : item,
            ),
          }
        : prev,
    );
  }

  function applyGoal(updated: StaffPlanGoalItem) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            goals: prev.goals.map((item) =>
              item.goal_id === updated.goal_id ? updated : item,
            ),
          }
        : prev,
    );
  }

  if (loading) {
    return <p className="staff-dashboard-muted mb-0">Loading plan structure…</p>;
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

  const showInitiatives = section === "both" || section === "initiatives";
  const showGoals = section === "both" || section === "goals";

  const noData =
    !data ||
    ((showInitiatives ? data.initiatives.length === 0 : true) &&
      (showGoals ? data.goals.length === 0 : true));

  if (noData) {
    const label =
      section === "initiatives"
        ? "initiatives"
        : section === "goals"
          ? "goals"
          : "initiatives or goals";
    return (
      <p className="staff-dashboard-muted mb-0">
        No {label} are defined for this client&apos;s active plan yet.
      </p>
    );
  }

  return (
    <div>
      {data.plan_created_at ? (
        <p className="small text-body-secondary mb-3">
          {data.plan_id ? `${data.plan_id} · ` : ""}
          Plan created {formatDateTime(data.plan_created_at)}
        </p>
      ) : null}

      {showInitiatives ? (
        <>
          <h3 className="staff-section-heading mb-2">
            Initiatives{" "}
            <span className="staff-dashboard-muted fw-normal">
              ({data.initiatives.length})
            </span>
          </h3>
          <div className={`staff-structure-stack${showGoals ? " mb-4" : ""}`}>
            {data.initiatives.length === 0 ? (
              <p className="staff-dashboard-muted mb-0">No initiatives.</p>
            ) : (
              data.initiatives.map((initiative) => (
                <InitiativeCard
                  key={initiative.initiative_id}
                  clientId={clientId}
                  initiative={initiative}
                  onSaved={applyInitiative}
                />
              ))
            )}
          </div>
        </>
      ) : null}

      {showGoals ? (
        <>
          <h3 className="staff-section-heading mb-2">
            Plan goals{" "}
            <span className="staff-dashboard-muted fw-normal">
              ({data.goals.length})
            </span>
          </h3>
          <div className="staff-structure-stack">
            {data.goals.length === 0 ? (
              <p className="staff-dashboard-muted mb-0">No goals.</p>
            ) : (
              data.goals.map((goal) => (
                <GoalCard
                  key={goal.goal_id}
                  clientId={clientId}
                  goal={goal}
                  onSaved={applyGoal}
                />
              ))
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
