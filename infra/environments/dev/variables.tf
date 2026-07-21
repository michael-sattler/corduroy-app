variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "us-east-1"
}

variable "project" {
  description = "Project name prefix for resources."
  type        = string
  default     = "corduroy"
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "dev"
}

variable "vpc_cidr" {
  description = "Vault VPC CIDR."
  type        = string
  default     = "10.0.0.0/16"
}

variable "vault_clients" {
  description = "Per-client Vault storage (KMS + S3). Key = client UUID from public.clients."
  type = map(object({
    name = string
  }))
  default = {}
}

variable "supabase_url" {
  description = "Supabase project URL for AccessBroker audit writes."
  type        = string
  default     = "https://iggvqbqqzujixshiffqe.supabase.co"
}

variable "supabase_service_role_key" {
  description = "Supabase service role key for AccessBroker (sensitive; leave empty to skip Lambda deploy)."
  type        = string
  sensitive   = true
  default     = ""
}

variable "anthropic_api_key_secret_arn" {
  description = "Secrets Manager ARN containing the raw Anthropic API key for Vault analysis."
  type        = string
  sensitive   = true
  default     = ""
}
