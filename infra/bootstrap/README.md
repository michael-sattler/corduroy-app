# Bootstrap — Terraform remote state

One-time stack that creates the S3 bucket and DynamoDB table for Terraform remote state. Uses **local state** in this folder only (chicken-and-egg).

## Resources

| Resource | Name |
|----------|------|
| S3 bucket | `corduroy-tfstate-<account-id>` |
| DynamoDB table | `corduroy-tfstate-lock` |

## Run

```powershell
cd infra/bootstrap
terraform init
terraform plan
terraform apply
```

Confirm with your account:

```powershell
aws sts get-caller-identity --query Account --output text
```

The default bucket name uses that account ID. Override with `-var="state_bucket_name=my-bucket"` if needed.

## After apply

1. Copy outputs into `environments/dev/backend.tf` if the account ID is not `789535501521`.
2. Continue with [../README.md](../README.md) → apply `environments/dev`.

## Destroy (careful)

Only if you have migrated or abandoned all environments. Destroying the state bucket while environments still depend on it loses infrastructure tracking.

```powershell
terraform destroy
```
