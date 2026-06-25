/**
 * Creates dev auth users and links them to Corduroy identity tables.
 *
 * Loads env from (first found wins per variable):
 *   .env
 *   apps/web/.env
 *   apps/web/.env.local
 *
 * Usage (from repo root):
 *   npm run db:seed
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { existsSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const file of [".env", "apps/web/.env", "apps/web/.env.local"]) {
  const path = resolve(repoRoot, file);
  if (existsSync(path)) {
    dotenv.config({ path });
  }
}

const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Set in .env or apps/web/.env:\n" +
      "  NEXT_PUBLIC_SUPABASE_URL\n" +
      "  SUPABASE_SERVICE_ROLE_KEY",
  );
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEV_CLIENT = {
  orgName: "All-American Fitness",
  legacyOrgNames: ["Acme Corp", "Acme"],
  email: "client@acmecorp.test",
  password: "CorduroyDev2026!",
  displayName: "Jane Client",
};

const DEV_STAFF = {
  email: "advisor@corduroytech.ai",
  password: "CorduroyDev2026!",
  displayName: "Corduroy Advisor",
  role: "advisor",
};

async function findUserByEmail(email) {
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  return data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
}

async function ensureAuthUser({ email, password, appMetadata, userMetadata }) {
  const existing = await findUserByEmail(email);
  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      app_metadata: appMetadata,
      user_metadata: userMetadata,
      email_confirm: true,
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: appMetadata,
    user_metadata: userMetadata,
  });
  if (error) throw error;
  return data.user;
}

async function ensureClientOrg(name, legacyNames = []) {
  const { data: existing, error: lookupError } = await admin
    .from("clients")
    .select("id, name")
    .eq("name", name)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing) return existing;

  for (const legacyName of legacyNames) {
    const { data: legacy, error: legacyError } = await admin
      .from("clients")
      .select("id, name")
      .eq("name", legacyName)
      .maybeSingle();

    if (legacyError) throw legacyError;
    if (!legacy) continue;

    const { data: renamed, error: renameError } = await admin
      .from("clients")
      .update({ name })
      .eq("id", legacy.id)
      .select("id, name")
      .single();

    if (renameError) throw renameError;
    console.log(`  Renamed client org "${legacyName}" → "${name}"`);
    return renamed;
  }

  const { data: inserted, error: insertError } = await admin
    .from("clients")
    .insert({ name })
    .select("id, name")
    .single();

  if (insertError) throw insertError;
  return inserted;
}

async function main() {
  console.log("Seeding Corduroy dev identity...");

  const client = await ensureClientOrg(
    DEV_CLIENT.orgName,
    DEV_CLIENT.legacyOrgNames,
  );
  const clientId = client.id;

  const clientUser = await ensureAuthUser({
    email: DEV_CLIENT.email,
    password: DEV_CLIENT.password,
    appMetadata: { role: "client", client_id: clientId },
    userMetadata: { display_name: DEV_CLIENT.displayName },
  });

  const { error: clientUserRowError } = await admin.from("client_users").upsert(
    {
      user_id: clientUser.id,
      client_id: clientId,
      display_name: DEV_CLIENT.displayName,
    },
    { onConflict: "user_id" },
  );
  if (clientUserRowError) throw clientUserRowError;

  const staffUser = await ensureAuthUser({
    email: DEV_STAFF.email,
    password: DEV_STAFF.password,
    appMetadata: { role: "staff", staff_role: DEV_STAFF.role },
    userMetadata: { display_name: DEV_STAFF.displayName },
  });

  const { data: staffRow, error: staffRowError } = await admin
    .from("staff")
    .upsert(
      {
        user_id: staffUser.id,
        role: DEV_STAFF.role,
        approved: true,
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single();
  if (staffRowError) throw staffRowError;

  const { error: assignmentError } = await admin.from("staff_assignments").upsert(
    {
      staff_id: staffRow.id,
      client_id: clientId,
    },
    { onConflict: "staff_id,client_id" },
  );
  if (assignmentError) throw assignmentError;

  console.log("Done.");
  console.log(`  Client org: ${DEV_CLIENT.orgName} (${clientId})`);
  console.log(`  Client login: ${DEV_CLIENT.email} / ${DEV_CLIENT.password}`);
  console.log(`  Staff login:  ${DEV_STAFF.email} / ${DEV_STAFF.password}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
