/**
 * End-to-end Vault ingest: upload via presign, poll catalog + audit.
 *
 * Usage (repo root, API running, ContentProcessor Lambda deployed):
 *   npm run test:vault-ingest
 *
 * Optional:
 *   API_URL=https://your-railway-domain npm run test:vault-ingest
 *   INGEST_POLL_SECONDS=90 npm run test:vault-ingest
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
const pollSeconds = Number(process.env.INGEST_POLL_SECONDS ?? "60");
const pollIntervalMs = 3000;

const DEV_CLIENT = {
  email: "client@acmecorp.test",
  password: "CorduroyDev2026!",
};

const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f \ntrailer<</Root 1 0 R/Size 3>>\nstartxref\n9\n%%EOF\n",
);

function restHeaders(key) {
  const headers = { apikey: key, Accept: "application/json" };
  if (key.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${key}`;
  }
  return headers;
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pollCatalog(s3Key) {
  const deadline = Date.now() + pollSeconds * 1000;

  while (Date.now() < deadline) {
    const vaultRes = await fetch(
      `${supabaseUrl}/rest/v1/vault_objects?s3_key=eq.${encodeURIComponent(s3Key)}&select=id,client_id,s3_key,prefix,object_type,source,size_bytes,created_at`,
      { headers: restHeaders(serviceRoleKey) },
    );

    if (!vaultRes.ok) {
      const detail = await vaultRes.text();
      throw new Error(`vault_objects query failed (${vaultRes.status}): ${detail}`);
    }

    const vaultRows = await vaultRes.json();
    if (Array.isArray(vaultRows) && vaultRows.length > 0) {
      const auditRes = await fetch(
        `${supabaseUrl}/rest/v1/audit_events?s3_key=eq.${encodeURIComponent(s3Key)}&action=eq.vault.ingest_raw&status=eq.completed&select=id,action,status,created_at&order=created_at.desc&limit=1`,
        { headers: restHeaders(serviceRoleKey) },
      );

      if (!auditRes.ok) {
        const detail = await auditRes.text();
        throw new Error(`audit_events query failed (${auditRes.status}): ${detail}`);
      }

      const auditRows = await auditRes.json();
      if (Array.isArray(auditRows) && auditRows.length > 0) {
        return { vaultObject: vaultRows[0], ingestAudit: auditRows[0] };
      }
    }

    process.stdout.write(".");
    await sleep(pollIntervalMs);
  }

  return null;
}

async function main() {
  if (!supabaseUrl || !anonKey) {
    console.error("Missing Supabase anon env.");
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY for catalog polling.");
    process.exit(1);
  }

  console.log(`API: ${apiUrl}`);
  console.log(`Poll window: ${pollSeconds}s`);

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword(DEV_CLIENT);

  if (authError || !authData.session?.access_token) {
    console.error("Sign-in failed:", authError?.message ?? "no session");
    process.exit(1);
  }

  const token = authData.session.access_token;
  const filename = `vault-ingest-test-${Date.now()}.pdf`;

  console.log("Signed in. Requesting presigned upload URL...");

  const presignRes = await fetch(`${apiUrl}/client/vault/presign-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename,
      content_type: "application/pdf",
      source: "manual-upload",
    }),
  });

  const presignBody = await presignRes.json().catch(() => ({}));
  if (!presignRes.ok) {
    console.error(`Presign failed (HTTP ${presignRes.status}):`, presignBody);
    process.exit(1);
  }

  console.log("Presign OK:", presignBody.s3_key);
  console.log("PUT to S3...");

  const putRes = await fetch(presignBody.url, {
    method: "PUT",
    headers: { "Content-Type": "application/pdf" },
    body: MINIMAL_PDF,
  });

  if (!putRes.ok) {
    const detail = await putRes.text().catch(() => "");
    console.error(`S3 PUT failed (HTTP ${putRes.status}):`, detail.slice(0, 500));
    process.exit(1);
  }

  console.log("Upload OK. Waiting for ContentProcessor (catalog + audit)...");

  const result = await pollCatalog(presignBody.s3_key);
  console.log("");

  if (!result) {
    console.error(
      `Timed out after ${pollSeconds}s — no vault_objects row or vault.ingest_raw audit.`,
    );
    console.error(
      "Check ContentProcessor Lambda logs and S3 bucket notification on raw/.",
    );
    process.exit(1);
  }

  console.log("Ingest OK:");
  console.log(
    JSON.stringify(
      {
        s3_key: presignBody.s3_key,
        bucket_name: presignBody.bucket_name,
        presign_audit_event_id: presignBody.audit_event_id,
        vault_object: result.vaultObject,
        ingest_audit_event: result.ingestAudit,
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
