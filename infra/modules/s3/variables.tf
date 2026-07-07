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

variable "browser_upload_origins" {
  description = "Browser origins allowed to PUT via pre-signed URLs (Vault upload flow)."
  type        = list(string)
  default = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://app.localhost:3000",
    "http://staff.localhost:3000",
    "https://app.corduroytech.ai",
    "https://staff.corduroytech.ai",
  ]
}

variable "content_processor_lambda_arn" {
  description = "ContentProcessor Lambda ARN for raw/ ObjectCreated notifications."
  type        = string
  default     = ""
}

variable "content_processor_lambda_name" {
  description = "ContentProcessor Lambda function name (for S3 invoke permission)."
  type        = string
  default     = ""
}

variable "content_processor_notifications_enabled" {
  description = "When true, wire S3 ObjectCreated on raw/ to ContentProcessor."
  type        = bool
  default     = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
