data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name_prefix = "${var.project}-${var.environment}"

  azs = slice(
    data.aws_availability_zones.available.names,
    0,
    var.private_subnet_count
  )

  private_subnet_cidrs = [
    for i in range(var.private_subnet_count) : cidrsubnet(var.vpc_cidr, 8, i)
  ]

  common_tags = merge(var.tags, {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Component   = "vault-network"
  })
}

resource "aws_vpc" "vault" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vault-vpc"
  })
}

resource "aws_subnet" "private" {
  count = var.private_subnet_count

  vpc_id            = aws_vpc.vault.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${local.azs[count.index]}"
    Tier = "private"
  })
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.vault.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-rt"
  })
}

resource "aws_route_table_association" "private" {
  count = var.private_subnet_count

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

resource "aws_security_group" "lambda" {
  name        = "${local.name_prefix}-lambda"
  description = "Default security group for Vault Lambdas in VPC"
  vpc_id      = aws_vpc.vault.id

  egress {
    description = "Allow outbound (restricted by VPC endpoints in practice)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.name_prefix}-vpc-endpoints"
  description = "HTTPS from Lambda to interface VPC endpoints"
  vpc_id      = aws_vpc.vault.id

  ingress {
    description     = "HTTPS from Lambda"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc-endpoints-sg"
  })
}

# Gateway endpoint — no hourly charge
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.vault.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-s3-endpoint"
  })
}

data "aws_region" "current" {}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = aws_vpc.vault.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.kms"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-kms-endpoint"
  })
}

resource "aws_vpc_endpoint" "logs" {
  count = var.enable_logs_endpoint ? 1 : 0

  vpc_id              = aws_vpc.vault.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.logs"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-logs-endpoint"
  })
}

resource "aws_vpc_endpoint" "secretsmanager" {
  count = var.enable_secretsmanager_endpoint ? 1 : 0

  vpc_id              = aws_vpc.vault.id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-secretsmanager-endpoint"
  })
}
