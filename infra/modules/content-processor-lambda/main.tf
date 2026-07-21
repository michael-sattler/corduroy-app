locals {
  name_prefix   = "${var.project}-${var.environment}"
  function_name = "${local.name_prefix}-content-processor"
}

resource "aws_lambda_function" "content_processor" {
  function_name = local.function_name
  role          = var.content_processor_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 120
  memory_size   = 512

  filename         = var.source_zip_path
  source_code_hash = filebase64sha256(var.source_zip_path)

  environment {
    variables = {
      SUPABASE_URL                    = var.supabase_url
      SUPABASE_SERVICE_ROLE_KEY       = var.supabase_service_role_key
      ANALYSIS_QUEUE_URL              = aws_sqs_queue.analysis.id
      ANTHROPIC_API_KEY_SECRET_ARN    = var.anthropic_api_key_secret_arn
      ANALYSIS_ENABLED                = var.anthropic_api_key_secret_arn != "" ? "true" : "false"
      AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
    }
  }

  tags = {
    Name      = local.function_name
    Component = "content-processor"
  }
}

resource "aws_cloudwatch_log_group" "content_processor" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 14
}

resource "aws_iam_role_policy_attachment" "basic_execution" {
  role       = var.content_processor_role_name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "railway_invoke_content_processor" {
  statement {
    effect    = "Allow"
    actions   = ["lambda:InvokeFunction"]
    resources = [aws_lambda_function.content_processor.arn]
  }
}

resource "aws_iam_user_policy" "railway_invoke_content_processor" {
  name   = "${local.name_prefix}-railway-invoke-content-processor"
  user   = var.railway_invoke_user_name
  policy = data.aws_iam_policy_document.railway_invoke_content_processor.json
}

resource "aws_sqs_queue" "analysis_dead_letter" {
  name                      = "${local.name_prefix}-vault-analysis-dlq"
  message_retention_seconds = 1209600
}

resource "aws_sqs_queue" "analysis" {
  name                       = "${local.name_prefix}-vault-analysis"
  visibility_timeout_seconds = 180
  message_retention_seconds  = 1209600

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.analysis_dead_letter.arn
    maxReceiveCount     = 3
  })
}

data "aws_iam_policy_document" "analysis_queue" {
  statement {
    effect = "Allow"
    actions = [
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
      "sqs:DeleteMessage",
      "sqs:GetQueueAttributes",
      "sqs:ChangeMessageVisibility",
    ]
    resources = [aws_sqs_queue.analysis.arn]
  }
}

resource "aws_iam_role_policy" "analysis_queue" {
  name   = "${local.name_prefix}-content-processor-analysis-queue"
  role   = var.content_processor_role_name
  policy = data.aws_iam_policy_document.analysis_queue.json
}

data "aws_iam_policy_document" "anthropic_api_key" {
  count = var.anthropic_api_key_secret_arn != "" ? 1 : 0

  statement {
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [var.anthropic_api_key_secret_arn]
  }
}

resource "aws_iam_role_policy" "anthropic_api_key" {
  count  = var.anthropic_api_key_secret_arn != "" ? 1 : 0
  name   = "${local.name_prefix}-content-processor-anthropic-key"
  role   = var.content_processor_role_name
  policy = data.aws_iam_policy_document.anthropic_api_key[0].json
}

resource "aws_lambda_event_source_mapping" "analysis_queue" {
  count            = var.anthropic_api_key_secret_arn != "" ? 1 : 0
  event_source_arn = aws_sqs_queue.analysis.arn
  function_name    = aws_lambda_function.content_processor.arn
  batch_size       = 1
  enabled          = true

  depends_on = [aws_iam_role_policy.analysis_queue]
}
