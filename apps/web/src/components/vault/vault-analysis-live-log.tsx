"use client";

import { useEffect, useRef, useState } from "react";

type AnalysisEvent = {
  id: number;
  occurred_at: string;
  stage: string;
  level: "debug" | "info" | "warning" | "error";
  message: string;
  details: Record<string, unknown>;
};

type AnalysisSnapshot = {
  job: {
    id: string;
    status: "queued" | "running" | "completed" | "failed" | "unsupported" | "cancelled";
    error_message: string | null;
  } | null;
  events: AnalysisEvent[];
  candidates: Array<{
    id: string;
    client_metric_id: string | null;
    metric_label: string;
    value: number;
    unit: string;
    period_start: string;
    period_end: string;
    confidence: number | null;
    evidence_excerpt: string;
    status: "pending_review" | "approved" | "rejected" | "superseded";
    duplicate: { kind: "published" | "candidate"; value: number; status?: string } | null;
  }>;
};

type VaultAnalysisLiveLogProps = {
  clientId: string;
  vaultObjectId: string | null;
};

const ACTIVE_STATUSES = new Set(["queued", "running"]);

function formatTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function stringifyDetails(details: Record<string, unknown>): string {
  const entries = Object.entries(details);
  return entries.length > 0 ? ` ${JSON.stringify(Object.fromEntries(entries))}` : "";
}

export function VaultAnalysisLiveLog({
  clientId,
  vaultObjectId,
}: VaultAnalysisLiveLogProps) {
  const [snapshot, setSnapshot] = useState<AnalysisSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!vaultObjectId) {
      setSnapshot(null);
      setError(null);
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let jobLookupAttempts = 0;

    const load = async () => {
      try {
        const params = new URLSearchParams({
          client_id: clientId,
          vault_object_id: vaultObjectId,
        });
        const response = await fetch(`/api/staff/vault/analysis?${params}`, {
          cache: "no-store",
        });
        const body = (await response.json().catch(() => ({}))) as
          | AnalysisSnapshot
          | { error?: string };
        if (!response.ok) {
          throw new Error("error" in body ? body.error : "Could not load analysis log.");
        }
        if (cancelled) return;

        const next = body as AnalysisSnapshot;
        setSnapshot(next);
        setError(null);
        if (!next.job) {
          jobLookupAttempts += 1;
          if (jobLookupAttempts < 40) {
            timeout = setTimeout(() => void load(), 1500);
          } else {
            setError(
              "The catalog entry appeared, but ContentProcessor did not create an analysis job. Check the Lambda deployment.",
            );
          }
        } else if (ACTIVE_STATUSES.has(next.job.status)) {
          timeout = setTimeout(() => void load(), 1500);
        }
      } catch (caught) {
        if (cancelled) return;
        setError(caught instanceof Error ? caught.message : "Could not load analysis log.");
      }
    };

    void load();
    return () => {
      cancelled = true;
      if (timeout) clearTimeout(timeout);
    };
  }, [clientId, refreshKey, vaultObjectId]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [snapshot?.events.length]);

  if (!vaultObjectId) {
    return null;
  }

  async function reviewCandidate(candidateId: string, decision: "approve" | "reject") {
    setReviewingId(candidateId);
    try {
      const response = await fetch("/api/staff/vault/analysis", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidate_id: candidateId, decision }),
      });
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error ?? "Could not save the candidate review.");
      }
      setRefreshKey((current) => current + 1);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not save the candidate review.",
      );
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <section className="app-card p-3 mt-3 vault-analysis-log" aria-live="polite">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
        <div>
          <h3 className="staff-section-heading mb-1">Live analysis log</h3>
          <p className="staff-dashboard-muted small mb-0">
            Safe, stage-level extraction diagnostics for this uploaded file.
          </p>
        </div>
        {snapshot?.job ? (
          <span className="badge text-bg-secondary text-uppercase">
            {snapshot.job.status}
          </span>
        ) : null}
      </div>

      <div
        ref={logRef}
        className="border rounded p-2 font-monospace overflow-auto vault-analysis-console"
      >
        {error ? (
          <span className="text-warning">{error}</span>
        ) : !snapshot ? (
          <span className="text-secondary">Waiting for the catalog and analysis job…</span>
        ) : !snapshot.job ? (
          <span className="text-secondary">
            Waiting for ContentProcessor to create the analysis job…
          </span>
        ) : snapshot.events.length === 0 ? (
          <span className="text-secondary">Waiting for the first analysis event…</span>
        ) : (
          snapshot.events.map((event) => (
            <div key={event.id}>
              <span className="text-secondary">[{formatTimestamp(event.occurred_at)}]</span>{" "}
              <span className="text-info">{event.stage}</span>{" "}
              <span
                className={
                  event.level === "error"
                    ? "text-danger"
                    : event.level === "warning"
                      ? "text-warning"
                      : ""
                }
              >
                {event.message}
              </span>
              {stringifyDetails(event.details)}
            </div>
          ))
        )}
      </div>
      {snapshot?.job?.error_message ? (
        <p className="text-danger small mt-2 mb-0">{snapshot.job.error_message}</p>
      ) : null}
      {snapshot?.candidates.length ? (
        <div className="mt-3">
          <h4 className="h6 mb-2">Proposed KPI observations</h4>
          <div className="vstack gap-2">
            {snapshot.candidates.map((candidate) => (
              <article key={candidate.id} className="border rounded p-2 small">
                <div className="d-flex flex-wrap justify-content-between gap-2">
                  <strong>{candidate.metric_label || "Unmapped metric"}</strong>
                  <span className="text-body-secondary text-uppercase">
                    {candidate.status.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-1">
                  {candidate.value} {candidate.unit} · {candidate.period_start} to{" "}
                  {candidate.period_end}
                  {candidate.confidence != null
                    ? ` · ${Math.round(candidate.confidence * 100)}% confidence`
                    : ""}
                </div>
                {candidate.evidence_excerpt ? (
                  <p className="text-body-secondary mb-2 mt-1">
                    Evidence: {candidate.evidence_excerpt}
                  </p>
                ) : null}
                {candidate.duplicate ? (
                  <p className="alert alert-warning py-1 px-2 small mb-2">
                    {candidate.duplicate.kind === "published"
                      ? "A published observation"
                      : "An earlier review candidate"}{" "}
                    already exists for this metric, period, and Vault document
                    ({candidate.duplicate.value}
                    {candidate.duplicate.status
                      ? ` · ${candidate.duplicate.status.replace("_", " ")}`
                      : ""}
                    ).
                  </p>
                ) : null}
                {candidate.status === "pending_review" ? (
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      disabled={reviewingId === candidate.id || !candidate.client_metric_id}
                      onClick={() => void reviewCandidate(candidate.id, "approve")}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      disabled={reviewingId === candidate.id}
                      onClick={() => void reviewCandidate(candidate.id, "reject")}
                    >
                      Reject
                    </button>
                    {!candidate.client_metric_id ? (
                      <span className="text-warning align-self-center">
                        Metric mapping required
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
