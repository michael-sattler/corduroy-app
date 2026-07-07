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

async function staffSupabase() {
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

  return { supabase, user };
}

export async function fetchPrompts(): Promise<{ prompts: PromptRecord[] }> {
  const { supabase } = await staffSupabase();
  const { data, error } = await supabase
    .from("prompt_library")
    .select("id, name, version, body, updated_at, updated_by")
    .order("name");

  if (error) throw new Error(error.message);
  return { prompts: data ?? [] };
}

export async function fetchWaitlist(): Promise<{ entries: WaitlistRecord[] }> {
  const { supabase } = await staffSupabase();
  const { data, error } = await supabase
    .from("waitlist_entries")
    .select("id, name, company, email, status, submitted_at, updated_at")
    .order("submitted_at", { ascending: false });

  if (error) throw new Error(error.message);
  return { entries: (data ?? []) as WaitlistRecord[] };
}

export async function fetchWaitlistEntry(
  id: string,
): Promise<{ entry: WaitlistRecord }> {
  const { supabase } = await staffSupabase();
  const { data, error } = await supabase
    .from("waitlist_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Waitlist entry not found");
  return { entry: data as WaitlistRecord };
}

export async function fetchClients(): Promise<{ clients: ClientRecord[] }> {
  const { supabase } = await staffSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, created_at, logo_path, logo_updated_at, client_users(count)")
    .order("name");

  if (error) throw new Error(error.message);

  return {
    clients: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      created_at: row.created_at,
      logo_path: row.logo_path ?? null,
      logo_updated_at: row.logo_updated_at ?? null,
      user_count:
        (row.client_users as { count: number }[] | null)?.[0]?.count ?? 0,
    })),
  };
}

export async function fetchClient(
  clientId: string,
): Promise<{ client: Omit<ClientRecord, "user_count"> }> {
  const { supabase } = await staffSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, created_at, logo_path, logo_updated_at")
    .eq("id", clientId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Client not found");
  return { client: data };
}

export async function fetchClientUsers(
  clientId: string,
): Promise<{ users: ClientUserRecord[] }> {
  const { supabase } = await staffSupabase();
  const fullSelect =
    "id, user_id, client_id, display_name, created_at, avatar_path, avatar_updated_at";

  const { data, error } = await supabase
    .from("client_users")
    .select(fullSelect)
    .eq("client_id", clientId)
    .order("display_name");

  if (!error) {
    return { users: data ?? [] };
  }

  if (error.message.includes("avatar_")) {
    const fallback = await supabase
      .from("client_users")
      .select("id, user_id, client_id, display_name, created_at")
      .eq("client_id", clientId)
      .order("display_name");

    if (fallback.error) throw new Error(fallback.error.message);

    return {
      users: (fallback.data ?? []).map((user) => ({
        ...user,
        avatar_path: null,
        avatar_updated_at: null,
      })),
    };
  }

  throw new Error(error.message);
}

export async function fetchStaff(): Promise<{ staff: StaffRecord[] }> {
  const { supabase } = await staffSupabase();
  const { data, error } = await supabase
    .from("staff")
    .select(
      "id, user_id, role, approved, created_at, avatar_path, avatar_updated_at",
    )
    .order("created_at");

  if (error) throw new Error(error.message);
  return { staff: (data ?? []) as StaffRecord[] };
}
