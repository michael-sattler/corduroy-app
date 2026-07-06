import { PostgrestClient } from "@supabase/postgrest-js";

export type ClientVaultStorage = {
  bucket_name: string;
  kms_key_arn: string;
};

let restClient: PostgrestClient | null = null;

function restHeaders(serviceRoleKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: serviceRoleKey };
  // Legacy JWT keys use Bearer; opaque sb_secret_* keys must use apikey only.
  if (serviceRoleKey.startsWith("eyJ")) {
    headers.Authorization = `Bearer ${serviceRoleKey}`;
  }
  return headers;
}

function getRestClient(): PostgrestClient {
  if (restClient) {
    return restClient;
  }

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  restClient = new PostgrestClient(`${url}/rest/v1`, {
    headers: restHeaders(serviceRoleKey),
  });

  return restClient;
}

export async function loadClientVaultStorage(
  clientId: string,
): Promise<ClientVaultStorage> {
  const rest = getRestClient();

  const { data, error } = await rest
    .from("client_vault_storage")
    .select("bucket_name, kms_key_arn, status, purpose")
    .eq("client_id", clientId)
    .eq("purpose", "primary")
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Vault storage lookup failed: ${error.message}`);
  }

  if (!data) {
    throw new Error("Vault storage is not provisioned for this client");
  }

  return {
    bucket_name: data.bucket_name,
    kms_key_arn: data.kms_key_arn,
  };
}

export async function insertAuditEvent(input: {
  client_id: string;
  actor_user_id: string;
  action: string;
  status: "pending" | "completed" | "failed";
  s3_key: string;
  s3_prefix: string;
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const rest = getRestClient();

  const { data, error } = await rest
    .from("audit_events")
    .insert({
      client_id: input.client_id,
      actor_user_id: input.actor_user_id,
      action: input.action,
      status: input.status,
      s3_key: input.s3_key,
      s3_prefix: input.s3_prefix,
      reason: input.reason,
      metadata: input.metadata ?? {},
      completed_at: input.status === "completed" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Audit insert failed: ${error.message}`);
  }

  return data.id;
}
