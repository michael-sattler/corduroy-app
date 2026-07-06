variable "project" {
  description = "Project name used in resource names and tags."
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)."
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the Vault VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_count" {
  description = "Number of private subnets (one per AZ, max available AZs)."
  type        = number
  default     = 2

  validation {
    condition     = var.private_subnet_count >= 2 && var.private_subnet_count <= 3
    error_message = "Use 2–3 private subnets for AZ spread."
  }
}

variable "enable_logs_endpoint" {
  description = "Create CloudWatch Logs interface endpoint (recommended for Lambda in VPC)."
  type        = bool
  default     = true
}

variable "enable_secretsmanager_endpoint" {
  description = "Create Secrets Manager interface endpoint (Phase 1 ContentDispatcher cred)."
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags merged into default tags."
  type        = map(string)
  default     = {}
}
