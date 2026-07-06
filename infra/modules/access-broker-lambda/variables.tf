variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "access_broker_role_arn" {
  type = string
}

variable "supabase_url" {
  type = string
}

variable "supabase_service_role_key" {
  type      = string
  sensitive = true
}

variable "source_zip_path" {
  description = "Path to the built access-broker Lambda zip (run npm run build:access-broker first)."
  type        = string
}

variable "railway_invoke_user_name" {
  description = "IAM user that Railway uses to invoke this Lambda."
  type        = string
  default     = ""
}
