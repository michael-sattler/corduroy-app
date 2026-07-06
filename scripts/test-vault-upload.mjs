/**
 * End-to-end Vault upload: presign via API, PUT bytes to S3.
 *
 * Usage (repo root, API running):
 *   npm run test:vault-upload
 *
 * Optional:
 *   API_URL=https://your-railway-domain npm run test:vault-upload
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

loadEnv(".env");
loadEnv("apps/web/.env");
loadEnv("apps/web/.env.local");
loadEnv("apps/api/.env");

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
const apiUrl = (
  process.env.API_URL ??
  process.env.ORCHESTRATION_API_URL ??
  "http://localhost:4000"
).replace(/\/$/, "");

const DEV_CLIENT = {
  email: "client@acmecorp.test",
  password: "CorduroyDev2026!",
};

const MINIMAL_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[]/Count 0>>endobj\nxref\n0 3\n0000000000 65535 f \ntrailer<</Root 1 0 R/Size 3>>\nstartxref\n9\n%%EOF\n",
);

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
    await supabase.auth.signInWithPassword(DEV_CLIENT);

  if (authError || !authData.session?.access_token) {
    console.error("Sign-in failed:", authError?.message ?? "no session");
    process.exit(1);
  }

  const token = authData.session.access_token;
  console.log("Signed in. Requesting presigned upload URL...");

  const presignRes = await fetch(`${apiUrl}/client/vault/presign-upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filename: "vault-smoke-test.pdf",
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

  console.log("Upload OK:");
  console.log(
    JSON.stringify(
      {
        s3_key: presignBody.s3_key,
        bucket_name: presignBody.bucket_name,
        audit_event_id: presignBody.audit_event_id,
        etag: putRes.headers.get("etag"),
        bytes: MINIMAL_PDF.length,
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
