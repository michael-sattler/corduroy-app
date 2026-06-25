import { type SupabaseClient } from "@supabase/supabase-js";
export declare function createUserSupabase(supabaseUrl: string, anonKey: string, accessToken: string): SupabaseClient;
