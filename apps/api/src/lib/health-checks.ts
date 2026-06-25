export type HealthStatus = "healthy" | "degraded" | "down";

export type HealthCheckResult = {
  service: string;
  status: HealthStatus;
  detail: string;
  latencyMs: number | null;
  checkedAt: string;
};

export async function checkOrchestrationApi(
  apiBaseUrl: string,
): Promise<HealthCheckResult> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const res = await fetch(`${apiBaseUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      return {
        service: "Orchestration API",
        status: "down",
        detail: `GET /health — HTTP ${res.status}`,
        latencyMs,
        checkedAt,
      };
    }

    return {
      service: "Orchestration API",
      status: "healthy",
      detail: `GET /health — ${latencyMs}ms`,
      latencyMs,
      checkedAt,
    };
  } catch (error) {
    return {
      service: "Orchestration API",
      status: "down",
      detail:
        error instanceof Error ? error.message : "Orchestration API unreachable",
      latencyMs: null,
      checkedAt,
    };
  }
}

export async function checkSupabase(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
): Promise<HealthCheckResult> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - started;

    if (!res.ok) {
      return {
        service: "Supabase Auth",
        status: "degraded",
        detail: `JWT validation failed — HTTP ${res.status}`,
        latencyMs,
        checkedAt,
      };
    }

    const { error } = await fetch(`${supabaseUrl}/rest/v1/prompt_library?select=id&limit=1`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(5000),
    }).then(async (dbRes) => ({
      error: dbRes.ok ? null : new Error(`HTTP ${dbRes.status}`),
    }));

    if (error) {
      return {
        service: "Supabase Auth",
        status: "degraded",
        detail: `Auth OK; database probe failed — ${error.message}`,
        latencyMs,
        checkedAt,
      };
    }

    return {
      service: "Supabase Auth",
      status: "healthy",
      detail: `JWT + Postgres OK — ${latencyMs}ms`,
      latencyMs,
      checkedAt,
    };
  } catch (error) {
    return {
      service: "Supabase Auth",
      status: "down",
      detail: error instanceof Error ? error.message : "Supabase unreachable",
      latencyMs: null,
      checkedAt,
    };
  }
}

export function checkNotConfigured(service: string, milestone: string): HealthCheckResult {
  return {
    service,
    status: "degraded",
    detail: `Not configured — ${milestone}`,
    latencyMs: null,
    checkedAt: new Date().toISOString(),
  };
}
