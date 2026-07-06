output "bucket_id" {
  description = "Vault S3 bucket name."
  value       = aws_s3_bucket.vault.id
}

output "bucket_arn" {
  description = "Vault S3 bucket ARN."
  value       = aws_s3_bucket.vault.arn
}
