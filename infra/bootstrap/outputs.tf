output "state_bucket_name" {
  description = "S3 bucket for Terraform remote state."
  value       = aws_s3_bucket.tfstate.id
}

output "lock_table_name" {
  description = "DynamoDB table for state locking."
  value       = aws_dynamodb_table.tfstate_lock.name
}

output "aws_region" {
  description = "Region where state resources were created."
  value       = var.aws_region
}

output "account_id" {
  description = "AWS account ID."
  value       = data.aws_caller_identity.current.account_id
}
