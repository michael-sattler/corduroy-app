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
    key            = "environments/prod/terraform.tfstate"
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
}
