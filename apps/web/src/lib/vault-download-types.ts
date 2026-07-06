export type VaultPresignDownloadRequest = {
  s3_key: string;
  reason?: string;
};

export type VaultPresignDownloadResponse = {
  operation: "presign_get";
  client_id: string;
  bucket_name: string;
  s3_key: string;
  s3_prefix: string;
  url: string;
  expires_in: number;
  audit_event_id: string;
};

export type VaultDownloadResult = VaultPresignDownloadResponse & {
  bytes: number;
};
