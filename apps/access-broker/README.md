# AccessBroker Lambda

Validates Vault scope, mints pre-signed S3 GET/PUT URLs, and appends `audit_events` rows (TDD §5.3–5.6).

## Build

```bash
npm run build:access-broker
```

Output: `dist/index.js` (bundled with esbuild for Node 20).

## Deploy

Configured via Terraform `infra/modules/access-broker-lambda`. Requires:

1. `npm run build:access-broker`
2. `supabase_service_role_key` in `infra/environments/dev/terraform.tfvars`
3. `terraform apply` in `infra/environments/dev`

## Invoke payload

```json
{
  "operation": "presign_put",
  "client_id": "<uuid>",
  "actor_user_id": "<auth.users uuid>",
  "upload": {
    "filename": "report.pdf",
    "content_type": "application/pdf",
    "source": "manual-upload"
  }
}
```

```json
{
  "operation": "presign_get",
  "client_id": "<uuid>",
  "actor_user_id": "<uuid>",
  "s3_key": "raw/manual-upload/2026-07-06T12-00-00Z-a1b2.pdf"
}
```

## Environment (Lambda)

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Insert `audit_events`, read `client_vault_storage` (`sb_secret_*` or legacy `eyJ` JWT) |

AWS credentials come from the execution role (S3 pre-sign only).
