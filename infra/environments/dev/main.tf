terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "corduroy-tfstate-789535501521"
    key            = "environments/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "corduroy-tfstate-lock"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "network" {
  source = "../../modules/network"

  project     = var.project
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
}

module "iam" {
  source = "../../modules/iam"

  project     = var.project
  environment = var.environment

  railway_invoke_deny_stub = var.supabase_service_role_key == ""
}

module "vault_client" {
  source   = "../../modules/vault-client"
  for_each = var.vault_clients

  project     = var.project
  environment = var.environment
  client_id   = each.key
  client_name = each.value.name

  access_broker_role_arn      = module.iam.access_broker_role_arn
  access_broker_role_name     = module.iam.access_broker_role_name
  content_processor_role_arn  = module.iam.content_processor_role_arn
  content_processor_role_name = module.iam.content_processor_role_name
}

data "archive_file" "access_broker" {
  count = var.supabase_service_role_key != "" ? 1 : 0

  type        = "zip"
  source_file = abspath("${path.module}/../../../apps/access-broker/dist/index.js")
  output_path = "${path.module}/.build/access-broker.zip"
}

module "access_broker_lambda" {
  count  = var.supabase_service_role_key != "" ? 1 : 0
  source = "../../modules/access-broker-lambda"

  project     = var.project
  environment = var.environment

  access_broker_role_arn    = module.iam.access_broker_role_arn
  supabase_url              = var.supabase_url
  supabase_service_role_key = var.supabase_service_role_key
  source_zip_path           = data.archive_file.access_broker[0].output_path
  railway_invoke_user_name  = module.iam.railway_invoke_user_name
}
