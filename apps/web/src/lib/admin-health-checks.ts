import type { HealthCheck } from "@/lib/admin-api-types";
import { getOrchestrationApiUrl } from "@/lib/admin-api";

export async function runAdminHealthChecks(
  accessToken: string,
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<HealthCheck[]> {
  const apiBase = getOrchestrationApiUrl();

  return Promise.all([
    checkOrchestrationApi(apiBase),
    checkSupabase(supabaseUrl, supabaseAnonKey, accessToken),
    Promise.resolve(
      checkNotConfigured("S3 (VPC endpoint)", "Milestone B3"),
    ),
    Promise.resolve(
      checkNotConfigured("AccessBroker Lambda", "Phase 1 Vault"),
    ),
  ]);
}

async function checkOrchestrationApi(apiBaseUrl: string): Promise<HealthCheck> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();
  const configuredUrl = process.env.ORCHESTRATION_API_URL?.trim();

  if (
    !configuredUrl ||
    configuredUrl.includes("127.0.0.1") ||
    configuredUrl.includes("localhost")
  ) {
    return {
      service: "Orchestration API",
      status: "degraded",
      detail:
        "ORCHESTRATION_API_URL not set on Vercel — deploy apps/api on Railway, then add the public Railway URL to Vercel env and redeploy",
      latencyMs: null,
      checkedAt,
    };
  }

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
        error instanceof Error
          ? `${error.message} (is npm run dev:api running?)`
          : "Orchestration API unreachable",
      latencyMs: null,
      checkedAt,
    };
  }
}

async function checkSupabase(
  supabaseUrl: string,
  anonKey: string,
  accessToken: string,
): Promise<HealthCheck> {
  const started = Date.now();
  const checkedAt = new Date().toISOString();

  try {
    const authRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    const latencyMs = Date.now() - started;

    if (!authRes.ok) {
      return {
        service: "Supabase Auth",
        status: "degraded",
        detail: `JWT validation failed — HTTP ${authRes.status}`,
        latencyMs,
        checkedAt,
      };
    }

    const dbRes = await fetch(
      `${supabaseUrl}/rest/v1/prompt_library?select=id&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
        },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!dbRes.ok) {
      return {
        service: "Supabase Auth",
        status: "degraded",
        detail: `Auth OK; database probe failed — HTTP ${dbRes.status}`,
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

function checkNotConfigured(service: string, milestone: string): HealthCheck {
  return {
    service,
    status: "degraded",
    detail: `Not configured — ${milestone}`,
    latencyMs: null,
    checkedAt: new Date().toISOString(),
  };
}
