output "key_id" {
  description = "KMS key ID."
  value       = aws_kms_key.vault.key_id
}

output "key_arn" {
  description = "KMS key ARN for bucket encryption and IAM policies."
  value       = aws_kms_key.vault.arn
}

output "alias_name" {
  description = "KMS alias name."
  value       = aws_kms_alias.vault.name
}
