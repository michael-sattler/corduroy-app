output "vpc_id" {
  description = "Vault VPC ID."
  value       = module.network.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs for Lambda."
  value       = module.network.private_subnet_ids
}

output "lambda_security_group_id" {
  description = "Lambda security group ID."
  value       = module.network.lambda_security_group_id
}

output "s3_vpc_endpoint_id" {
  description = "S3 gateway VPC endpoint."
  value       = module.network.s3_vpc_endpoint_id
}

output "kms_vpc_endpoint_id" {
  description = "KMS interface VPC endpoint."
  value       = module.network.kms_vpc_endpoint_id
}

output "access_broker_role_arn" {
  description = "AccessBroker Lambda execution role ARN."
  value       = module.iam.access_broker_role_arn
}

output "content_processor_role_arn" {
  description = "ContentDispatcher Lambda execution role ARN."
  value       = module.iam.content_processor_role_arn
}

output "railway_invoke_user_name" {
  description = "Railway invoke-only IAM user (stub until Phase 1)."
  value       = module.iam.railway_invoke_user_name
}

output "vault_clients" {
  description = "Per-client Vault bucket and KMS key (empty until vault_clients is set in tfvars)."
  value = {
    for client_id, vault in module.vault_client : client_id => {
      bucket_id      = vault.bucket_id
      bucket_arn     = vault.bucket_arn
      kms_key_arn    = vault.kms_key_arn
      kms_alias_name = vault.kms_alias_name
    }
  }
}

output "access_broker_function_arn" {
  description = "AccessBroker Lambda ARN (null until supabase_service_role_key is set and Lambda is built)."
  value       = try(module.access_broker_lambda[0].function_arn, null)
}

output "access_broker_function_name" {
  description = "AccessBroker Lambda function name."
  value       = try(module.access_broker_lambda[0].function_name, null)
}

output "content_processor_function_arn" {
  description = "ContentProcessor Lambda ARN (null until supabase_service_role_key is set and Lambda is built)."
  value       = try(module.content_processor_lambda[0].function_arn, null)
}

output "content_processor_function_name" {
  description = "ContentProcessor Lambda function name."
  value       = try(module.content_processor_lambda[0].function_name, null)
}
