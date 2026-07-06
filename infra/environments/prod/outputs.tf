output "vpc_id" {
  value = module.network.vpc_id
}

output "private_subnet_ids" {
  value = module.network.private_subnet_ids
}

output "access_broker_role_arn" {
  value = module.iam.access_broker_role_arn
}

output "content_processor_role_arn" {
  value = module.iam.content_processor_role_arn
}
