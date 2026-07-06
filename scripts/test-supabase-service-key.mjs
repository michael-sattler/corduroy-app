/**
 * Verify a Supabase service-role / secret key can read client_vault_storage.
 *
 * Usage (repo root):
 *   node scripts/test-supabase-service-key.mjs
 *
 * Loads SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from apps/web/.env, .env, or
 * infra/environments/dev/terraform.tfvars (supabase_service_role_key).
 */

import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(relativePath) {
  const path = resolve(repoRoot, relativePath);
  if (existsSync(path)) {
    dotenv.config({ path, override: true });
  }
}

loadEnvFile(".env");
loadEnvFile("apps/web/.env");
loadEnvFile("apps/web/.env.local");

const tfvarsPath = resolve(repoRoot, "infra/environments/dev/terraform.tfvars");
if (
  !process.env.SUPABASE_SERVICE_ROLE_KEY &&
  existsSync(tfvarsPath)
) {
  const match = readFileSync(tfvarsPath, "utf8").match(
    /supabase_service_role_key\s*=\s*"([^"]+)"/,
  );
  if (match) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = match[1];
  }
}

const url =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function describeKey(value) {
  if (!value) return "missing";
  if (value.startsWith("eyJ")) return "legacy JWT (service_role)";
  if (value.startsWith("sb_secret_")) return `secret (${value.slice(0, 20)}…)`;
  return "unknown format";
}

async function main() {
  if (!url || !key) {
    console.error(
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (apps/web/.env or terraform.tfvars).",
    );
    process.exit(1);
  }

  console.log(`Supabase: ${url}`);
  console.log(`Key: ${describeKey(key)}`);

  const headers = { apikey: key, Accept: "application/json" };
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  }

  const res = await fetch(
    `${url}/rest/v1/client_vault_storage?select=client_id,bucket_name&limit=1`,
    { headers },
  );

  const text = await res.text();
  if (!res.ok) {
    console.error(`REST failed (HTTP ${res.status}):`, text);
    process.exit(1);
  }

  console.log("REST OK — service key can read client_vault_storage:");
  console.log(text);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
