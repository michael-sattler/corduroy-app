/**
 * Staff Vault download: presign via API for assigned client, GET bytes from S3.
 *
 * Usage (repo root, API running):
 *   npm run test:vault-staff-download
 *
 * Optional:
 *   VAULT_CLIENT_ID=... VAULT_S3_KEY=raw/... npm run test:vault-staff-download
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { existsSync, readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(relativePath, override = true) {
  const path = resolve(repoRoot, relativePath);
  if (existsSync(path)) {
    dotenv.config({ path, override });
  }
}

loadEnv(".env");
loadEnv("apps/web/.env");
loadEnv("apps/web/.env.local");
loadEnv("apps/api/.env");

const tfvarsPath = resolve(repoRoot, "infra/environments/dev/terraform.tfvars");
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && existsSync(tfvarsPath)) {
  const match = readFileSync(tfvarsPath, "utf8").match(
    /supabase_service_role_key\s*=\s*"([^"]+)"/,
  );
  if (match) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = match[1];
  }
}

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const apiUrl = (
  process.env.API_URL ??
  process.env.ORCHESTRATION_API_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

const DEV_STAFF = {
  email: "advisor@corduroytech.ai",
  password: "CorduroyDev2026!",
};

const DEFAULT_CLIENT_ID = "9811e315-7f2d-4484-9929-709900bb1bbd";

function restHeaders(key) {
  const headers = { apikey: key, Accept: "application/json" };
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

async function resolveTarget(clientId) {
  if (process.env.VAULT_S3_KEY?.trim()) {
    return {
      clientId,
      s3Key: process.env.VAULT_S3_KEY.trim(),
    };
  }

  if (!serviceRoleKey) {
    throw new Error("Set VAULT_S3_KEY or SUPABASE_SERVICE_ROLE_KEY.");
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/vault_objects?client_id=eq.${encodeURIComponent(clientId)}&select=s3_key&order=created_at.desc&limit=1`,
    { headers: restHeaders(serviceRoleKey) },
  );

  if (!res.ok) {
    throw new Error(`vault_objects lookup failed (${res.status})`);
  }

  const rows = await res.json();
  const s3Key = rows?.[0]?.s3_key;
  if (!s3Key) {
    throw new Error("No vault_objects for client — upload a file first.");
  }

  return { clientId, s3Key };
}

async function main() {
  if (!supabaseUrl || !anonKey) {
    console.error("Missing Supabase env.");
    process.exit(1);
  }

  console.log(`API: ${apiUrl}`);

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword(DEV_STAFF);

  if (authError || !authData.session?.access_token) {
    console.error("Staff sign-in failed:", authError?.message ?? "no session");
    process.exit(1);
  }

  const token = authData.session.access_token;
  const clientId = process.env.VAULT_CLIENT_ID?.trim() || DEFAULT_CLIENT_ID;
  const { s3Key } = await resolveTarget(clientId);

  console.log("Signed in as staff. Requesting presigned download URL for:");
  console.log(`  client ${clientId}`);
  console.log(`  ${s3Key}`);

  const presignRes = await fetch(`${apiUrl}/staff/vault/presign-download`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ client_id: clientId, s3_key: s3Key }),
  });

  const presignBody = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok) {
    console.error(`Presign failed (HTTP ${presignRes.status}):`, presignBody);
    process.exit(1);
  }

  console.log("Presign OK. GET from S3...");

  const getRes = await fetch(presignBody.url);
  if (!getRes.ok) {
    const detail = await getRes.text().catch(() => "");
    console.error(`S3 GET failed (HTTP ${getRes.status}):`, detail.slice(0, 500));
    process.exit(1);
  }

  const bytes = Buffer.from(await getRes.arrayBuffer());

  console.log("Staff download OK:");
  console.log(
    JSON.stringify(
      {
        client_id: clientId,
        s3_key: presignBody.s3_key,
        bucket_name: presignBody.bucket_name,
        audit_event_id: presignBody.audit_event_id,
        bytes: bytes.length,
        content_type: getRes.headers.get("content-type"),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
