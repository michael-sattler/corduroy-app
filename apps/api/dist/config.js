const DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://app.localhost:3000",
    "http://staff.localhost:3000",
    "https://app.corduroytech.ai",
    "https://staff.corduroytech.ai",
];
function requireEnv(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (!value) {
        throw new Error(`Missing required env var: ${name}`);
    }
    return value;
}
export function loadConfig() {
    const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const corsOrigins = (process.env.CORS_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    return {
        port: Number(process.env.PORT ?? 4000),
        supabaseUrl: requireEnv("SUPABASE_URL", supabaseUrl),
        supabaseAnonKey: requireEnv("SUPABASE_ANON_KEY", supabaseAnonKey),
        corsOrigins: corsOrigins.length > 0 ? corsOrigins : DEFAULT_CORS_ORIGINS,
    };
}
