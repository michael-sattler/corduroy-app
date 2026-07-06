# Corduroy AWS infrastructure (Terraform)

Terraform for the Vault **data plane** on AWS: VPC, VPC endpoints, and IAM stubs (B3). Per-client buckets, KMS keys, and Lambdas land in Phase 1.

**Region:** `us-east-1` (change in `terraform.tfvars` if you standardize elsewhere).

**Reference:** [buildplan-vault.md](../docs/buildplan-vault.md)

## Layout

```
infra/
├── bootstrap/           # One-time: S3 + DynamoDB for remote state (local state)
├── environments/
│   ├── dev/             # B3 target environment — apply here first
│   └── prod/            # Same modules; apply when prod is ready
└── modules/
    ├── network/         # VPC, subnets, endpoints (B3)
    ├── iam/             # Lambda execution roles, railway-invoke stub (B3)
    ├── kms/             # Stub — Phase 1
    ├── s3/              # Stub — Phase 1
    └── lambda/          # Stub — Phase 1
```

## Prerequisites

- AWS CLI configured (`admin-sattler` or equivalent admin)
- Terraform ≥ 1.5
- Account ID in bootstrap/README matches your account

Verify:

```powershell
aws sts get-caller-identity
terraform version
```

## First-time setup

### 1. Bootstrap remote state

```powershell
cd infra/bootstrap
terraform init
terraform plan
terraform apply
```

Note the outputs: `state_bucket_name`, `lock_table_name`.

### 2. Configure dev backend

`infra/environments/dev/backend.tf` is pre-wired for account `789535501521`. If your account ID differs, edit `bucket` in that file after bootstrap.

### 3. Apply dev (B3 skeleton)

```powershell
cd infra/environments/dev
copy terraform.tfvars.example terraform.tfvars   # optional; defaults are fine
terraform init
terraform plan
terraform apply
```

Review the plan: **only** VPC, subnets, security groups, VPC endpoints, and IAM roles/users — no S3 vault buckets, no KMS keys, no Lambdas.

### 4. Provision first client bucket (Phase 1.1)

In Supabase SQL Editor:

```sql
select id, name from public.clients where name = 'All-American Fitness';
```

Add to `environments/dev/terraform.tfvars`:

```hcl
vault_clients = {
  "<client-uuid>" = { name = "All-American Fitness" }
}
```

Then `terraform plan` and `terraform apply`. Outputs `vault_clients` lists `bucket_id` and `kms_key_arn`.

### 5. Deploy AccessBroker (Phase 1.2)

```powershell
npm run build:access-broker
```

Add to `environments/dev/terraform.tfvars`:

```hcl
supabase_service_role_key = "your-service-role-key"
```

```powershell
terraform apply
```

Set on Railway / local API: `ACCESS_BROKER_LAMBDA_NAME`, `AWS_REGION`, and keys for `corduroy-dev-railway-invoke`.

AccessBroker is **not** placed in the VPC: it must reach Supabase over the public internet, and dev private subnets have no NAT gateway. S3/KMS presigns still use IAM over TLS via the public AWS APIs.

### 6. Verify

```powershell
terraform output
aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=$(terraform output -raw vpc_id)"
```

## Key outputs (dev)

| Output | Use |
|--------|-----|
| `vpc_id` | Lambda VPC config (Phase 1) |
| `private_subnet_ids` | Lambda subnets (Phase 1) |
| `lambda_security_group_id` | Lambda ENI security group |
| `access_broker_role_arn` | AccessBroker execution role |
| `content_processor_role_arn` | ContentDispatcher execution role |
| `railway_invoke_user_name` | Railway invoke-only IAM user (no keys until Phase 1) |
| `s3_vpc_endpoint_id` | Network audit |
| `kms_vpc_endpoint_id` | Network audit |
| `vault_clients` | Per-client bucket + KMS (after Phase 1.1 tfvars) |
| `access_broker_function_arn` | Lambda ARN for API `ACCESS_BROKER_LAMBDA_NAME` |

Do not commit `terraform.tfvars` or access keys. Railway gets invoke-only credentials in Phase 1, not the admin profile.

## KMS guardrail (Phase 1+)

Per-client KMS keys are **never deleted**. Only a break-glass principal may schedule key deletion. See `modules/iam/README.md` and TDD §5.7.

## Prod

Mirror dev: copy/adjust `environments/prod`, set `environment = "prod"` in `terraform.tfvars`, use a distinct state key in `backend.tf` (`environments/prod/terraform.tfstate`).
