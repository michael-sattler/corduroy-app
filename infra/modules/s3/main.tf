locals {
  name_prefix = "${var.project}-${var.environment}"
  client_slug = replace(var.client_id, "-", "")
  bucket_name = "${local.name_prefix}-vault-${local.client_slug}"

  common_tags = merge(var.tags, {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Component   = "vault-s3"
    ClientId    = var.client_id
    ClientName  = var.client_name
  })
}

resource "aws_s3_bucket" "vault" {
  bucket = local.bucket_name

  tags = merge(local.common_tags, {
    Name = local.bucket_name
  })
}

resource "aws_s3_bucket_public_access_block" "vault" {
  bucket = aws_s3_bucket.vault.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "vault" {
  bucket = aws_s3_bucket.vault.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = var.kms_key_arn
    }

    bucket_key_enabled = true
  }
}

data "aws_iam_policy_document" "vault_bucket" {
  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions   = ["s3:*"]
    resources = [aws_s3_bucket.vault.arn, "${aws_s3_bucket.vault.arn}/*"]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  statement {
    sid    = "LambdaVaultObjectAccess"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        var.access_broker_role_arn,
        var.content_processor_role_arn,
      ]
    }

    actions = [
      "s3:GetObject",
      "s3:PutObject",
      "s3:AbortMultipartUpload",
      "s3:GetObjectAttributes",
    ]

    resources = ["${aws_s3_bucket.vault.arn}/*"]
  }

  statement {
    sid    = "LambdaVaultListBucket"
    effect = "Allow"

    principals {
      type = "AWS"
      identifiers = [
        var.access_broker_role_arn,
        var.content_processor_role_arn,
      ]
    }

    actions = [
      "s3:ListBucket",
      "s3:GetBucketLocation",
    ]

    resources = [aws_s3_bucket.vault.arn]
  }
}

resource "aws_s3_bucket_policy" "vault" {
  bucket = aws_s3_bucket.vault.id
  policy = data.aws_iam_policy_document.vault_bucket.json
}

# Prefix layout (virtual): raw/, derived/, context/, audit/ — created on first object write.
