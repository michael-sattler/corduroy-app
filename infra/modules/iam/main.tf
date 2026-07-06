locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(var.tags, {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Component   = "vault-iam"
  })
}

data "aws_iam_policy_document" "lambda_assume" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "access_broker" {
  name               = "${local.name_prefix}-access-broker"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-access-broker"
    Role = "access-broker"
  })
}

resource "aws_iam_role" "content_processor" {
  name               = "${local.name_prefix}-content-processor"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-content-processor"
    Role = "content-processor"
  })
}

resource "aws_iam_role_policy_attachment" "access_broker_vpc" {
  role       = aws_iam_role.access_broker.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "content_processor_vpc" {
  role       = aws_iam_role.content_processor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# B3 stub: no S3/KMS policies until per-client buckets exist (Phase 1).
# Phase 1 will attach scoped policies per client bucket + KMS key ARN.

# Railway will invoke Lambdas only — no direct S3/KMS (TDD §5.3).
# No access keys created here; invoke-only policy is attached when AccessBroker is deployed.
resource "aws_iam_user" "railway_invoke" {
  name = "${local.name_prefix}-railway-invoke"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-railway-invoke"
  })
}

# Placeholder policy until AccessBroker Lambda exists.
data "aws_iam_policy_document" "railway_invoke_stub" {
  count = var.railway_invoke_deny_stub ? 1 : 0

  statement {
    sid    = "DenyAllUntilLambdasExist"
    effect = "Deny"
    actions = [
      "s3:*",
      "kms:*",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_user_policy" "railway_invoke_stub" {
  count = var.railway_invoke_deny_stub ? 1 : 0

  name   = "${local.name_prefix}-railway-invoke-stub"
  user   = aws_iam_user.railway_invoke.name
  policy = data.aws_iam_policy_document.railway_invoke_stub[0].json
}
