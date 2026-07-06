export type VaultPrefix = "raw" | "derived" | "context" | "audit";

export type AccessBrokerOperation = "presign_put" | "presign_get";

export type AccessBrokerUploadInput = {
  filename: string;
  content_type: string;
  source: string;
  prefix?: VaultPrefix;
};

export type AccessBrokerRequest = {
  operation: AccessBrokerOperation;
  client_id: string;
  actor_user_id: string;
  reason?: string;
  upload?: AccessBrokerUploadInput;
  s3_key?: string;
};

export type AccessBrokerResponse = {
  operation: AccessBrokerOperation;
  client_id: string;
  bucket_name: string;
  s3_key: string;
  s3_prefix: VaultPrefix;
  url: string;
  expires_in: number;
  audit_event_id: string;
};

export type AccessBrokerErrorResponse = {
  error: string;
  code?: string;
};
