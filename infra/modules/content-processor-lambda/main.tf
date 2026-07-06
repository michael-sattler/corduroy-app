locals {
  name_prefix   = "${var.project}-${var.environment}"
  function_name = "${local.name_prefix}-content-processor"
}

resource "aws_lambda_function" "content_processor" {
  function_name = local.function_name
  role          = var.content_processor_role_arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  timeout       = 60
  memory_size   = 512

  filename         = var.source_zip_path
  source_code_hash = filebase64sha256(var.source_zip_path)

  environment {
    variables = {
      SUPABASE_URL              = var.supabase_url
      SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
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
