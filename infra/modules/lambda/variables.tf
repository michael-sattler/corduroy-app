variable "project" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_id" {
  type    = string
  default = ""
}

variable "private_subnet_ids" {
  type    = list(string)
  default = []
}

variable "lambda_security_group_id" {
  type    = string
  default = ""
}

variable "access_broker_role_arn" {
  type    = string
  default = ""
}

variable "content_processor_role_arn" {
  type    = string
  default = ""
}
