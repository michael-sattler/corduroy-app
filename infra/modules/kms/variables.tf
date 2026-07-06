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

variable "access_broker_role_arn" {
  description = "AccessBroker Lambda execution role ARN."
  type        = string
}

variable "content_processor_role_arn" {
  description = "ContentDispatcher Lambda execution role ARN."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}
