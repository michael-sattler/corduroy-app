output "function_name" {
  value = aws_lambda_function.content_processor.function_name
}

output "function_arn" {
  value = aws_lambda_function.content_processor.arn
}

output "invoke_arn" {
  value = aws_lambda_function.content_processor.invoke_arn
}
