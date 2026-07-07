import type { FastifyRequest } from "fastify";
import type { ApiConfig } from "../config.js";
import { createUserSupabase } from "./supabase-user.js";

function bearerToken(request: FastifyRequest): string {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new Error("Missing Bearer token");
  }
  return header.slice("Bearer ".length).trim();
}

export class StaffClientAccessError extends Error {
  constructor(
    message: string,
    readonly statusCode = 403,
  ) {
    super(message);
    this.name = "StaffClientAccessError";
  }
}

export async function assertStaffCanAccessClient(
  config: ApiConfig,
  request: FastifyRequest,
  clientId: string,
): Promise<void> {
  const trimmedClientId = clientId.trim();
  if (!trimmedClientId) {
    throw new StaffClientAccessError("client_id is required", 400);
  }

  const db = createUserSupabase(
    config.supabaseUrl,
    config.supabaseAnonKey,
    bearerToken(request),
  );

  const { data, error } = await db
    .from("clients")
    .select("id")
    .eq("id", trimmedClientId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new StaffClientAccessError("Client not found or not assigned to you");
  }
}
