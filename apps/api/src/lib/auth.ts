import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FastifyReply, FastifyRequest } from "fastify";
import { authUserFromSupabase, type AuthUser, type UserRole } from "./roles.js";

let supabaseAuth: SupabaseClient | null = null;

export function initSupabaseAuth(url: string, anonKey: string) {
  supabaseAuth = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getSupabaseAuth(): SupabaseClient {
  if (!supabaseAuth) {
    throw new Error("Supabase auth client not initialized");
  }
  return supabaseAuth;
}

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

export async function verifyAccessToken(
  token: string,
): Promise<AuthUser | null> {
  const supabase = getSupabaseAuth();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return null;
  }
  return authUserFromSupabase(data.user);
}

export function requireRole(role: UserRole) {
  return async function authHook(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<void> {
    const token = bearerToken(request);
    if (!token) {
      reply.code(401).send({ error: "Missing Bearer token" });
      return;
    }

    const user = await verifyAccessToken(token);
    if (!user) {
      reply.code(401).send({ error: "Invalid or expired token" });
      return;
    }

    if (user.role !== role) {
      reply.code(403).send({ error: "Wrong surface for this token" });
      return;
    }

    request.authUser = user;
  };
}

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthUser;
  }
}
