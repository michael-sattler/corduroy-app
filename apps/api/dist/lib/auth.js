import { createClient } from "@supabase/supabase-js";
import { authUserFromSupabase } from "./roles.js";
let supabaseAuth = null;
export function initSupabaseAuth(url, anonKey) {
    supabaseAuth = createClient(url, anonKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
function getSupabaseAuth() {
    if (!supabaseAuth) {
        throw new Error("Supabase auth client not initialized");
    }
    return supabaseAuth;
}
function bearerToken(request) {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return null;
    }
    const token = header.slice("Bearer ".length).trim();
    return token || null;
}
export async function verifyAccessToken(token) {
    const supabase = getSupabaseAuth();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
        return null;
    }
    return authUserFromSupabase(data.user);
}
export function requireRole(role) {
    return async function authHook(request, reply) {
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
