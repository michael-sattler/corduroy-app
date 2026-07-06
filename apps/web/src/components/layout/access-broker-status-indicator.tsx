"use client";

import { useCallback, useEffect, useState } from "react";
import {
  accessBrokerStatusLabel,
  accessBrokerStatusTitle,
  type AccessBrokerHealth,
  type AccessBrokerHealthStatus,
} from "@/lib/access-broker-status-types";

const REFRESH_MS = 5 * 60 * 1000;

function statusDotClass(status: AccessBrokerHealthStatus | "loading" | "error"): string {
  switch (status) {
    case "healthy":
      return "ok";
    case "not_configured":
      return "warning";
    case "unhealthy":
    case "error":
      return "down";
    default:
      return "loading";
  }
}

export function AccessBrokerStatusIndicator() {
  const [health, setHealth] = useState<AccessBrokerHealth | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/staff/vault/access-broker-status", {
        cache: "no-store",
      });
      const data = (await res.json()) as AccessBrokerHealth & { error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? `Status check failed (${res.status})`);
      }

      setHealth(data);
    } catch (err) {
      setHealth(null);
      setError(err instanceof Error ? err.message : "Status check failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const visualStatus: AccessBrokerHealthStatus | "loading" | "error" = loading
    ? "loading"
    : error
      ? "error"
      : (health?.status ?? "unhealthy");

  const title = health
    ? accessBrokerStatusTitle(health)
    : error
      ? `AccessBroker status unavailable — ${error}`
      : "Checking AccessBroker…";

  const label = health
    ? accessBrokerStatusLabel(health.status)
    : error
      ? "AccessBroker status unavailable"
      : "Checking AccessBroker…";

  return (
    <button
      type="button"
      className="staff-access-broker-status"
      title={title}
      aria-label={title}
      onClick={() => void refresh()}
    >
      <span
        className={`staff-status-dot ${statusDotClass(visualStatus)}`}
        aria-hidden
      />
      <span className="staff-access-broker-status-label">{label}</span>
    </button>
  );
}
