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

variable "tags" {
  type    = map(string)
  default = {}
}
