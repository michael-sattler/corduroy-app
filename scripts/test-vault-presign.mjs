/**
 * Smoke-test AccessBroker via the orchestration API (no curl).
 *
 * Loads env from (first found): .env, apps/web/.env.local, apps/api/.env
 *
 * Usage (repo root, API running on :4000):
 *   npm run test:vault-presign
 *
 * Optional:
 *   API_URL=http://localhost:4000 npm run test:vault-presign
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(relativePath, override = true) {
  const path = resolve(repoRoot, relativePath);
  if (existsSync(path)) {
    dotenv.config({ path, override });
  }
}

// Later files win — same priority as local dev (web .env.local overrides .env)
loadEnv(".env");
loadEnv("apps/web/.env");
loadEnv("apps/web/.env.local");
loadEnv("apps/api/.env");

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const apiUrl = (process.env.API_URL ?? process.env.ORCHESTRATION_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const DEV_CLIENT = {
  email: "client@acmecorp.test",
  password: "CorduroyDev2026!",
};

function describeAnonKey(key) {
  if (!key) return "missing";
  if (key.startsWith("eyJ")) return "legacy JWT (anon)";
  if (key.startsWith("sb_publishable_")) return "publishable (sb_publishable_*)";
  return "unknown format";
}

async function main() {
  if (!supabaseUrl || !anonKey) {
    console.error(
      "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in apps/web/.env.local",
    );
    process.exit(1);
  }

  console.log(`API: ${apiUrl}`);
  console.log(`Sign-in anon key: ${describeAnonKey(anonKey)}`);

  const webAnon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const apiAnon = process.env.SUPABASE_ANON_KEY?.trim() ?? "";
  if (webAnon && apiAnon && webAnon !== apiAnon) {
    console.warn(
      "Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_ANON_KEY differ — API JWT checks may fail.",
    );
  }
  console.log(`Signing in as ${DEV_CLIENT.email}...`);

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword(DEV_CLIENT);

  if (authError || !authData.session?.access_token) {
    console.error("Sign-in failed:", authError?.message ?? "no session");
    if (authError?.message?.includes("Unregistered API key")) {
      console.error("");
      console.error(
        "Fix: Supabase Dashboard → Project Settings → API → Legacy API Keys → anon (starts with eyJ...).",
      );
      console.error(
        "Put it in apps/web/.env.local as NEXT_PUBLIC_SUPABASE_ANON_KEY (overrides apps/web/.env).",
      );
      console.error(
        "If app login works in the browser but this script fails, you likely only have the key in .env.local — create that file.",
      );
    }
    process.exit(1);
  }

  const token = authData.session.access_token;
  console.log("Signed in. Requesting presigned upload URL...");

  const res = await fetch(`${apiUrl}/client/vault/presign-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: "test.pdf",
      content_type: "application/pdf",
      source: "manual-upload",
    }),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  if (!res.ok) {
    console.error(`Presign failed (HTTP ${res.status}):`);
    console.error(body);
    process.exit(1);
  }

  console.log("Presign OK:");
  console.log(JSON.stringify(body, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
