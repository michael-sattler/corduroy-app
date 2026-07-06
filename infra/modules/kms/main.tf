data "aws_caller_identity" "current" {}

locals {
  name_prefix = "${var.project}-${var.environment}"
  client_slug = replace(var.client_id, "-", "")

  common_tags = merge(var.tags, {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Component   = "vault-kms"
    ClientId    = var.client_id
    ClientName  = var.client_name
  })
}

data "aws_iam_policy_document" "vault_key" {
  statement {
    sid    = "AccountAdmin"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }

  statement {
    sid    = "LambdaVaultCrypto"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        var.access_broker_role_arn,
        var.content_processor_role_arn,
      ]
    }

    actions = [
      "kms:Decrypt",
      "kms:Encrypt",
      "kms:GenerateDataKey",
      "kms:GenerateDataKeyWithoutPlaintext",
      "kms:DescribeKey",
    ]

    resources = ["*"]
  }
}

resource "aws_kms_key" "vault" {
  description             = "Corduroy Vault SSE-KMS for client ${var.client_id}"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy                  = data.aws_iam_policy_document.vault_key.json

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vault-${local.client_slug}"
  })
}

resource "aws_kms_alias" "vault" {
  name          = "alias/${local.name_prefix}-vault-${local.client_slug}"
  target_key_id = aws_kms_key.vault.key_id
}
