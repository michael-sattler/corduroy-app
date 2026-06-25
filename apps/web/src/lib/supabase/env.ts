function normalizeEnvValue(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  return trimmed || undefined;
}

function normalizeSupabaseUrl(url: string): string | undefined {
  let candidate = url.trim();

  if (!candidate.startsWith("http://") && !candidate.startsWith("https://")) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return undefined;
    }
    return parsed.origin;
  } catch {
    return undefined;
  }
}

export type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

/** Returns null when env is missing or invalid (safe for middleware). */
export function getPublicSupabaseConfig(): PublicSupabaseConfig | null {
  const rawUrl = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnvValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!rawUrl || !anonKey) {
    return null;
  }

  const url = normalizeSupabaseUrl(rawUrl);
  if (!url) {
    return null;
  }

  return { url, anonKey };
}

/** Throws with a setup hint when env is missing or invalid. */
export function requirePublicSupabaseConfig(): PublicSupabaseConfig {
  const config = getPublicSupabaseConfig();

  if (!config) {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "(not set)";
    throw new Error(
      "Invalid or missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL to " +
        "https://iggvqbqqzujixshiffqe.supabase.co and NEXT_PUBLIC_SUPABASE_ANON_KEY " +
        "to your publishable key in Vercel → Settings → Environment Variables " +
        "(Production + Preview), then redeploy. " +
        `Current NEXT_PUBLIC_SUPABASE_URL=${JSON.stringify(rawUrl)}`,
    );
  }

  return config;
}
