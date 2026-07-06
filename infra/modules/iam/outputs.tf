output "access_broker_role_arn" {
  description = "IAM role ARN for the AccessBroker Lambda."
  value       = aws_iam_role.access_broker.arn
}

output "access_broker_role_name" {
  description = "IAM role name for the AccessBroker Lambda."
  value       = aws_iam_role.access_broker.name
}

output "content_processor_role_arn" {
  description = "IAM role ARN for the ContentDispatcher Lambda."
  value       = aws_iam_role.content_processor.arn
}

output "content_processor_role_name" {
  description = "IAM role name for the ContentDispatcher Lambda."
  value       = aws_iam_role.content_processor.name
}

output "railway_invoke_user_name" {
  description = "IAM user for Railway invoke-only access (no keys until Phase 1)."
  value       = aws_iam_user.railway_invoke.name
}

output "railway_invoke_user_arn" {
  description = "IAM user ARN for Railway."
  value       = aws_iam_user.railway_invoke.arn
}
