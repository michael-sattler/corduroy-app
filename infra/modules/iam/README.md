# IAM module — B3 stubs

## Roles (B3)

| Role | Purpose |
|------|---------|
| `{project}-{env}-access-broker` | AccessBroker Lambda execution role |
| `{project}-{env}-content-processor` | ContentDispatcher Lambda execution role |

Both attach `AWSLambdaVPCAccessExecutionRole` only. **No S3 or KMS policies** until Phase 1 per-client resources exist.

## Railway user (B3 stub)

`{project}-{env}-railway-invoke` — IAM user with a deny stub on `s3:*` and `kms:*`. In Phase 1, replace with `lambda:InvokeFunction` on specific function ARNs. Do not grant S3 or KMS to Railway (TDD §5.3).

## KMS guardrails (Phase 1+)

When adding per-client KMS keys in `modules/kms`:

- Set key rotation on; use aliases like `alias/corduroy-vault-{client_id}`.
- **Never schedule key deletion** in normal operations.
- Restrict `kms:ScheduleKeyDeletion` and `kms:DisableKey` to a break-glass admin principal only.
- AWS enforces a 7–30 day waiting period before deletion — use CloudTrail alarms on those API calls.
