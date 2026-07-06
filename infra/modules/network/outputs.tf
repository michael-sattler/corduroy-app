output "vpc_id" {
  description = "Vault VPC ID."
  value       = aws_vpc.vault.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs for Lambda placement."
  value       = aws_subnet.private[*].id
}

output "lambda_security_group_id" {
  description = "Security group for Vault Lambdas."
  value       = aws_security_group.lambda.id
}

output "vpc_endpoints_security_group_id" {
  description = "Security group attached to interface VPC endpoints."
  value       = aws_security_group.vpc_endpoints.id
}

output "s3_vpc_endpoint_id" {
  description = "S3 gateway VPC endpoint ID."
  value       = aws_vpc_endpoint.s3.id
}

output "kms_vpc_endpoint_id" {
  description = "KMS interface VPC endpoint ID."
  value       = aws_vpc_endpoint.kms.id
}

output "logs_vpc_endpoint_id" {
  description = "CloudWatch Logs interface VPC endpoint ID (null if disabled)."
  value       = try(aws_vpc_endpoint.logs[0].id, null)
}

output "secretsmanager_vpc_endpoint_id" {
  description = "Secrets Manager interface VPC endpoint ID (null if disabled)."
  value       = try(aws_vpc_endpoint.secretsmanager[0].id, null)
}
