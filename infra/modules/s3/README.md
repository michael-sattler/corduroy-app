# S3 module — per-client Vault bucket

- Bucket: `{project}-{env}-vault-{client_id_without_hyphens}`
- Prefixes (virtual): `raw/`, `derived/`, `context/`, `audit/`
- SSE-KMS via `modules/kms`; bucket policy allows Lambda roles only (no delete)
- Client cost tags: `ClientId`, `ClientName`

Wired via `modules/vault-client`.
