import "server-only";

import {
  getOrchestrationApiUrl,
  getStaffAccessToken,
  StaffApiHttpError,
} from "@/lib/admin-api";
import type { AccessBrokerHealth } from "@/lib/access-broker-status-types";

export async function fetchAccessBrokerHealth(): Promise<AccessBrokerHealth> {
  const token = await getStaffAccessToken();
  const apiBase = getOrchestrationApiUrl();

  const res = await fetch(`${apiBase}/staff/vault/access-broker-status`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new StaffApiHttpError(
      res.status,
      body.error ?? `AccessBroker status failed (${res.status})`,
    );
  }

  return (await res.json()) as AccessBrokerHealth;
}
