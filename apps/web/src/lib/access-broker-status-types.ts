export type AccessBrokerHealthStatus =
  | "healthy"
  | "not_configured"
  | "unhealthy";

export type AccessBrokerHealth = {
  status: AccessBrokerHealthStatus;
  function_name: string | null;
  detail: string;
  latency_ms: number | null;
  checked_at: string;
};

export function accessBrokerStatusLabel(status: AccessBrokerHealthStatus): string {
  switch (status) {
    case "healthy":
      return "AccessBroker healthy";
    case "not_configured":
      return "AccessBroker not configured";
    case "unhealthy":
      return "AccessBroker unhealthy";
  }
}

export function accessBrokerStatusTitle(health: AccessBrokerHealth): string {
  const name = health.function_name ?? "AccessBroker";
  return `${accessBrokerStatusLabel(health.status)} — ${name}: ${health.detail}`;
}
