module "kms" {
  source = "../kms"

  project     = var.project
  environment = var.environment
  client_id   = var.client_id
  client_name = var.client_name

  access_broker_role_arn     = var.access_broker_role_arn
  content_processor_role_arn = var.content_processor_role_arn

  tags = var.tags
}

module "s3" {
  source = "../s3"

  project     = var.project
  environment = var.environment
  client_id   = var.client_id
  client_name = var.client_name

  kms_key_arn                = module.kms.key_arn
  access_broker_role_arn     = var.access_broker_role_arn
  content_processor_role_arn = var.content_processor_role_arn

  tags = var.tags
}

locals {
  client_slug = replace(var.client_id, "-", "")
}

data "aws_iam_policy_document" "access_broker_vault" {
  statement {
    sid    = "KmsForClient"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:DescribeKey",
    ]

    resources = [module.kms.key_arn]
  }

  statement {
    sid    = "S3PresignForClient"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:AbortMultipartUpload",
    ]

    resources = ["${module.s3.bucket_arn}/*"]
  }

  statement {
    sid    = "S3ListForReconciliation"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]

    resources = [module.s3.bucket_arn]
  }
}

data "aws_iam_policy_document" "content_processor_vault" {
  statement {
    sid    = "KmsForClient"
    effect = "Allow"

    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:DescribeKey",
    ]

    resources = [module.kms.key_arn]
  }

  statement {
    sid    = "S3ReadWriteForClient"
    effect = "Allow"

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:AbortMultipartUpload",
      "s3:GetObjectAttributes",
    ]

    resources = ["${module.s3.bucket_arn}/*"]
  }

  statement {
    sid    = "S3ListForReconciliation"
    effect = "Allow"

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]

    resources = [module.s3.bucket_arn]
  }
}

resource "aws_iam_role_policy" "access_broker_vault" {
  name   = "${var.project}-${var.environment}-access-broker-${local.client_slug}"
  role   = var.access_broker_role_name
  policy = data.aws_iam_policy_document.access_broker_vault.json
}

resource "aws_iam_role_policy" "content_processor_vault" {
  name   = "${var.project}-${var.environment}-content-processor-${local.client_slug}"
  role   = var.content_processor_role_name
  policy = data.aws_iam_policy_document.content_processor_vault.json
}
