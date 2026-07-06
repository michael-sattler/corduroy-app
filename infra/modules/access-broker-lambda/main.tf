locals {
  name_prefix  = "${var.project}-${var.environment}"
  function_name = "${local.name_prefix}-access-broker"
}

resource "aws_lambda_function" "access_broker" {
  function_name = local.function_name
  role          = var.access_broker_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 30
  memory_size   = 256

  filename         = var.source_zip_path
  source_code_hash = filebase64sha256(var.source_zip_path)

  # No VPC: this function calls Supabase over the public internet for storage
  # lookup and audit writes. Private subnets have no NAT, so VPC placement causes
  # 30s timeouts. S3/KMS presigns use IAM via the public AWS APIs (TLS). The
  # ContentDispatcher (Phase 1.3) may use VPC + NAT when it needs in-VPC S3 I/O.

  environment {
    variables = {
      SUPABASE_URL                   = var.supabase_url
      SUPABASE_SERVICE_ROLE_KEY      = var.supabase_service_role_key
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }

  tags = {
    Name      = local.function_name
    Component = "access-broker"
  }
}

resource "aws_cloudwatch_log_group" "access_broker" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 14
}

data "aws_iam_policy_document" "railway_invoke" {
  count = var.railway_invoke_user_name != "" ? 1 : 0

  statement {
    sid    = "InvokeAccessBroker"
    effect = "Allow"

    actions = [
      "lambda:InvokeFunction",
    ]

    resources = [
      aws_lambda_function.access_broker.arn,
    ]
  }
}

resource "aws_iam_user_policy" "railway_invoke_access_broker" {
  count = var.railway_invoke_user_name != "" ? 1 : 0

  name = "${local.name_prefix}-railway-invoke-access-broker"
  user = var.railway_invoke_user_name

  policy = data.aws_iam_policy_document.railway_invoke[0].json
}
