variable "project" {
  description = "Project name used in resource names and tags."
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)."
  type        = string
}

variable "tags" {
  description = "Additional tags merged into default tags."
  type        = map(string)
  default     = {}
}

variable "railway_invoke_deny_stub" {
  description = "Attach a deny stub on S3/KMS until AccessBroker invoke policy is wired."
  type        = bool
  default     = true
}
