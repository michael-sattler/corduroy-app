import "server-only";

import { existsSync } from "node:fs";

import { readUserRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import type {
  PromptRecord,
  WaitlistRecord,
  ClientRecord,
  ClientUserRecord,
  StaffRecord,
} from "@/lib/admin-api-types";

export type {
  HealthCheck,
  HealthStatus,
  PromptRecord,
  WaitlistRecord,
  ClientRecord,
  ClientUserRecord,
  StaffRecord,
} from "@/lib/admin-api-types";

export {
  formatHealthCheckedAt,
  formatSubmittedAt,
  formatWaitlistStatus,
} from "@/lib/admin-api-types";

export class StaffApiHttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "StaffApiHttpError";
  }
}

export function getOrchestrationApiUrl(): string {
  const fromEnv = process.env.ORCHESTRATION_API_URL?.trim();
  const inDocker = existsSync("/.dockerenv");

  // Inside Docker, 127.0.0.1 / localhost is the container — use the compose service.
  if (inDocker) {
    if (
      fromEnv &&
      !fromEnv.includes("127.0.0.1") &&
      !fromEnv.includes("localhost")
    ) {
      return fromEnv;
    }
    return "http://api:4000";
  }

  return fromEnv || "http://127.0.0.1:4000";
}

export async function getStaffAccessToken(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new StaffApiHttpError(401, "Not authenticated");
  }

  if (readUserRole(user.app_metadata) !== "staff") {
    throw new StaffApiHttpError(403, "Staff access required");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new StaffApiHttpError(401, "Session expired — sign in again");
  }

  return session.access_token;
}

/** Staff JWT gate for route handlers (no surface redirect / notFound). */
export async function requireStaffApiAccess(): Promise<void> {
  await getStaffAccessToken();
}

export async function staffApiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const token = await getStaffAccessToken();
  const apiBase = getOrchestrationApiUrl();

  let response: Response;
  try {
    response = await fetch(`${apiBase}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Orchestration API unreachable";
    throw new Error(
      `Cannot reach orchestration API at ${apiBase} (${detail}). Is \`npm run dev:api\` running?`,
    );
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${path} failed (${response.status}): ${text}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchPrompts(): Promise<{ prompts: PromptRecord[] }> {
  return staffApiFetch("/staff/admin/prompts");
}

export async function fetchWaitlist(): Promise<{ entries: WaitlistRecord[] }> {
  return staffApiFetch("/staff/admin/waitlist");
}

export async function fetchWaitlistEntry(
  id: string,
): Promise<{ entry: WaitlistRecord }> {
  return staffApiFetch(`/staff/admin/waitlist/${id}`);
}

export async function fetchClients(): Promise<{ clients: ClientRecord[] }> {
  return staffApiFetch("/staff/admin/clients");
}

export async function fetchClient(
  clientId: string,
): Promise<{ client: Omit<ClientRecord, "user_count"> }> {
  return staffApiFetch(`/staff/admin/clients/${clientId}`);
}

export async function fetchClientUsers(
  clientId: string,
): Promise<{ users: ClientUserRecord[] }> {
  return staffApiFetch(`/staff/admin/clients/${clientId}/users`);
}

export async function fetchStaff(): Promise<{ staff: StaffRecord[] }> {
  return staffApiFetch("/staff/admin/staff");
}
