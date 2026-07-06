# ContentProcessor Lambda

Triggered by S3 `ObjectCreated` on `raw/` prefixes. Catalogs uploads in `vault_objects` and appends `vault.ingest_raw` audit rows.

## Build

```bash
npm run build:content-processor
```

## Deploy

Terraform module `infra/modules/content-processor-lambda`. Requires `supabase_service_role_key` in tfvars (same as AccessBroker).

Note: `audit_events` is append-only — ingest completion adds a new `vault.ingest_raw` row; the pending `vault.presign_put` row from AccessBroker is unchanged.
