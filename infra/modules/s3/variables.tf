variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "client_id" {
  description = "Corduroy client UUID from public.clients."
  type        = string
}

variable "client_name" {
  description = "Human-readable client name (tags only)."
  type        = string
  default     = ""
}

variable "kms_key_arn" {
  description = "KMS key ARN for default bucket encryption."
  type        = string
}

variable "access_broker_role_arn" {
  type = string
}

variable "content_processor_role_arn" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
