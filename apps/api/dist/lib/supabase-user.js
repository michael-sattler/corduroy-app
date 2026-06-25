import { createClient } from "@supabase/supabase-js";
export function createUserSupabase(supabaseUrl, anonKey, accessToken) {
    return createClient(supabaseUrl, anonKey, {
        global: {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        },
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
