import { PostgrestClient } from "@supabase/postgrest-js";

export type ClientVaultRecord = {
  client_id: string;
  bucket_name: string;
};

let restClient: PostgrestClient | null = null;

function restHeaders(serviceRoleKey: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: serviceRoleKey };
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

export async function resolveClientByBucket(
  bucketName: string,
): Promise<ClientVaultRecord> {
  const rest = getRestClient();

  const { data, error } = await rest
    .from("client_vault_storage")
    .select("client_id, bucket_name, status, purpose")
    .eq("bucket_name", bucketName)
    .eq("purpose", "primary")
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(`Vault storage lookup failed: ${error.message}`);
  }

  if (!data) {
    throw new Error(`No client mapped to bucket ${bucketName}`);
  }

  return {
    client_id: data.client_id,
    bucket_name: data.bucket_name,
  };
}

export async function upsertVaultObject(input: {
  client_id: string;
  s3_key: string;
  prefix: string;
  object_type: string;
  source: string;
  size_bytes: number | null;
}): Promise<string> {
  const rest = getRestClient();

  const { data, error } = await rest
    .from("vault_objects")
    .upsert(
      {
        client_id: input.client_id,
        s3_key: input.s3_key,
        prefix: input.prefix,
        object_type: input.object_type,
        source: input.source,
        size_bytes: input.size_bytes,
      },
      { onConflict: "client_id,s3_key" },
    )
    .select("id")
    .single();

  if (error) {
    throw new Error(`Vault catalog upsert failed: ${error.message}`);
  }

  return data.id;
}

export async function insertIngestAuditEvent(input: {
  client_id: string;
  s3_key: string;
  s3_prefix: string;
  status: "completed" | "failed";
  reason: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const rest = getRestClient();

  const { data, error } = await rest
    .from("audit_events")
    .insert({
      client_id: input.client_id,
      actor_user_id: null,
      action: "vault.ingest_raw",
      status: input.status,
      s3_key: input.s3_key,
      s3_prefix: input.s3_prefix,
      reason: input.reason,
      metadata: input.metadata ?? {},
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`Audit insert failed: ${error.message}`);
  }

  return data.id;
}
