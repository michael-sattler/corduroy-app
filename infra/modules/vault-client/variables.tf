variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "client_id" {
  type = string
}

variable "client_name" {
  type    = string
  default = ""
}

variable "access_broker_role_arn" {
  type = string
}

variable "access_broker_role_name" {
  type = string
}

variable "content_processor_role_arn" {
  type = string
}

variable "content_processor_role_name" {
  type = string
}

variable "content_processor_lambda_arn" {
  type    = string
  default = ""
}

variable "content_processor_lambda_name" {
  type    = string
  default = ""
}

variable "content_processor_notifications_enabled" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
