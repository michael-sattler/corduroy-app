variable "aws_region" {
  description = "AWS region for the state bucket and lock table."
  type        = string
  default     = "us-east-1"
}

variable "state_bucket_name" {
  description = "S3 bucket for Terraform state. Defaults to corduroy-tfstate-<account-id>."
  type        = string
  default     = null
}

variable "lock_table_name" {
  description = "DynamoDB table for state locking."
  type        = string
  default     = "corduroy-tfstate-lock"
}
