output "client_id" {
  value = var.client_id
}

output "kms_key_arn" {
  value = module.kms.key_arn
}

output "kms_alias_name" {
  value = module.kms.alias_name
}

output "bucket_id" {
  value = module.s3.bucket_id
}

output "bucket_arn" {
  value = module.s3.bucket_arn
}
