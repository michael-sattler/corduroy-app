import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { AccessBrokerOperation } from "./types.js";

const PRESIGN_EXPIRY_SECONDS = 900;

const s3 = new S3Client({});

export async function mintPresignedUrl(input: {
  operation: AccessBrokerOperation;
  bucketName: string;
  kmsKeyArn: string;
  s3Key: string;
  contentType?: string;
}): Promise<{ url: string; expires_in: number }> {
  const expiresIn = PRESIGN_EXPIRY_SECONDS;

  if (input.operation === "presign_put") {
    if (!input.contentType) {
      throw new Error("content_type is required for presign_put");
    }

    const command = new PutObjectCommand({
      Bucket: input.bucketName,
      Key: input.s3Key,
      ContentType: input.contentType,
      ServerSideEncryption: "aws:kms",
      SSEKMSKeyId: input.kmsKeyArn,
    });

    const url = await getSignedUrl(s3, command, { expiresIn });
    return { url, expires_in: expiresIn };
  }

  const command = new GetObjectCommand({
    Bucket: input.bucketName,
    Key: input.s3Key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  return { url, expires_in: expiresIn };
}
