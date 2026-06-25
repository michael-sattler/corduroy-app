"use client";

import { useCallback, useState } from "react";
import {
  formatHealthCheckedTime,
  type HealthCheck,
} from "@/lib/admin-api-types";

type AdminHealthSectionProps = {
  initialChecks: HealthCheck[];
  initialError?: string | null;
};

export function AdminHealthSection({
  initialChecks,
  initialError = null,
}: AdminHealthSectionProps) {
  const [checks, setChecks] = useState(initialChecks);
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const runChecks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/health", { cache: "no-store" });
      const data = (await res.json()) as {
        checks?: HealthCheck[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? `Health check failed (${res.status})`);
      }
      if (!data.checks) {
        throw new Error("Health check returned no data");
      }
      setChecks(data.checks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Health check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <section className="app-card">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h6 mb-0">Health check</h2>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          onClick={() => void runChecks()}
          disabled={loading}
        >
          {loading ? "Running…" : "Run checks"}
        </button>
      </div>

      {error ? (
        <div className="alert alert-warning py-2 small mb-3">{error}</div>
      ) : null}

      <div className="d-flex flex-column gap-2">
        {checks.map((check) => (
          <div key={check.service} className="admin-health-row">
            <span
              className={`admin-health-dot ${check.status}`}
              aria-hidden
            />
            <div className="flex-grow-1">
              <div className="fw-medium">{check.service}</div>
              <div className="small text-body-secondary">{check.detail}</div>
            </div>
            <span className="small text-body-secondary">
              {formatHealthCheckedTime(check.checkedAt)}
            </span>
            <span className={`badge admin-health-badge ${check.status}`}>
              {check.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
