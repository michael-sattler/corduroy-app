variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "content_processor_role_arn" {
  type = string
}

variable "content_processor_role_name" {
  type = string
}

variable "railway_invoke_user_name" {
  type = string
}

variable "supabase_url" {
  type = string
}

variable "supabase_service_role_key" {
  type      = string
  sensitive = true
}

variable "anthropic_api_key_secret_arn" {
  description = "Optional Secrets Manager ARN containing the raw Anthropic API key."
  type        = string
  default     = ""
}

variable "source_zip_path" {
  type = string
}
