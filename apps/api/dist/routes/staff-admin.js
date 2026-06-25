import { requireRole } from "../lib/auth.js";
import { checkNotConfigured, checkOrchestrationApi, checkSupabase, } from "../lib/health-checks.js";
import { createUserSupabase } from "../lib/supabase-user.js";
function bearerToken(request) {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        throw new Error("Missing Bearer token");
    }
    return header.slice("Bearer ".length).trim();
}
function userDb(config, request) {
    return createUserSupabase(config.supabaseUrl, config.supabaseAnonKey, bearerToken(request));
}
export async function registerStaffAdminRoutes(app, config) {
    await app.register(async (admin) => {
        admin.addHook("onRequest", requireRole("staff"));
        admin.get("/health", async (request) => {
            const token = bearerToken(request);
            const apiBase = process.env.API_PUBLIC_URL ??
                `http://127.0.0.1:${config.port}`;
            const checks = await Promise.all([
                checkOrchestrationApi(apiBase),
                checkSupabase(config.supabaseUrl, config.supabaseAnonKey, token),
                Promise.resolve(checkNotConfigured("S3 (VPC endpoint)", "Milestone B3")),
                Promise.resolve(checkNotConfigured("AccessBroker Lambda", "Phase 1 Vault")),
            ]);
            return { checks };
        });
        admin.get("/prompts", async (request) => {
            const db = userDb(config, request);
            const { data, error } = await db
                .from("prompt_library")
                .select("id, name, version, body, updated_at, updated_by")
                .order("name");
            if (error)
                throw error;
            return { prompts: data ?? [] };
        });
        admin.get("/prompts/:id", async (request, reply) => {
            const db = userDb(config, request);
            const { data, error } = await db
                .from("prompt_library")
                .select("id, name, version, body, updated_at, updated_by")
                .eq("id", request.params.id)
                .maybeSingle();
            if (error)
                throw error;
            if (!data) {
                return reply.code(404).send({ error: "Prompt not found" });
            }
            return { prompt: data };
        });
        admin.put("/prompts/:id", async (request, reply) => {
            const db = userDb(config, request);
            const body = request.body;
            const token = bearerToken(request);
            const { data: userData } = await db.auth.getUser(token);
            const { data, error } = await db
                .from("prompt_library")
                .update({
                ...(body.name !== undefined ? { name: body.name } : {}),
                ...(body.body !== undefined ? { body: body.body } : {}),
                ...(body.version !== undefined ? { version: body.version } : {}),
                updated_at: new Date().toISOString(),
                updated_by: userData.user?.id ?? null,
            })
                .eq("id", request.params.id)
                .select("id, name, version, body, updated_at, updated_by")
                .single();
            if (error) {
                return reply.code(400).send({ error: error.message });
            }
            return { prompt: data };
        });
        admin.get("/waitlist", async (request) => {
            const db = userDb(config, request);
            const { data, error } = await db
                .from("waitlist_entries")
                .select("id, name, company, email, status, submitted_at, updated_at")
                .order("submitted_at", { ascending: false });
            if (error)
                throw error;
            return { entries: data ?? [] };
        });
        admin.get("/waitlist/:id", async (request, reply) => {
            const db = userDb(config, request);
            const { data, error } = await db
                .from("waitlist_entries")
                .select("*")
                .eq("id", request.params.id)
                .maybeSingle();
            if (error)
                throw error;
            if (!data) {
                return reply.code(404).send({ error: "Waitlist entry not found" });
            }
            return { entry: data };
        });
        admin.patch("/waitlist/:id", async (request, reply) => {
            const db = userDb(config, request);
            const body = request.body;
            const { data, error } = await db
                .from("waitlist_entries")
                .update({
                ...(body.status !== undefined ? { status: body.status } : {}),
                ...(body.notes !== undefined ? { notes: body.notes } : {}),
                updated_at: new Date().toISOString(),
            })
                .eq("id", request.params.id)
                .select("*")
                .single();
            if (error) {
                return reply.code(400).send({ error: error.message });
            }
            return { entry: data };
        });
        admin.get("/clients", async (request) => {
            const db = userDb(config, request);
            const { data, error } = await db
                .from("clients")
                .select("id, name, created_at, client_users(count)")
                .order("name");
            if (error)
                throw error;
            return {
                clients: (data ?? []).map((row) => ({
                    id: row.id,
                    name: row.name,
                    created_at: row.created_at,
                    user_count: row.client_users?.[0]?.count ?? 0,
                })),
            };
        });
        admin.get("/clients/:clientId", async (request, reply) => {
            const db = userDb(config, request);
            const { data, error } = await db
                .from("clients")
                .select("id, name, created_at")
                .eq("id", request.params.clientId)
                .maybeSingle();
            if (error)
                throw error;
            if (!data) {
                return reply.code(404).send({ error: "Client not found" });
            }
            return { client: data };
        });
        admin.get("/clients/:clientId/users", async (request) => {
            const db = userDb(config, request);
            const { data, error } = await db
                .from("client_users")
                .select("id, user_id, client_id, display_name, created_at")
                .eq("client_id", request.params.clientId)
                .order("display_name");
            if (error)
                throw error;
            return { users: data ?? [] };
        });
        admin.get("/staff", async (request) => {
            const db = userDb(config, request);
            const { data, error } = await db
                .from("staff")
                .select("id, user_id, role, approved, created_at")
                .order("created_at");
            if (error)
                throw error;
            return { staff: data ?? [] };
        });
    }, { prefix: "/staff/admin" });
}
