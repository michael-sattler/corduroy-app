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

variable "supabase_url" {
  type = string
}

variable "supabase_service_role_key" {
  type      = string
  sensitive = true
}

variable "source_zip_path" {
  type = string
}
