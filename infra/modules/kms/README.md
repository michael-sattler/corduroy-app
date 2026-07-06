# KMS module — per-client Vault key

One CMK per client, used for SSE-KMS on the matching S3 bucket.

- Alias: `alias/{project}-{env}-vault-{client_id_without_hyphens}`
- Key policy: account root + Lambda execution roles
- Rotation enabled; **never schedule deletion** in normal ops (TDD §5.7)

Wired via `modules/vault-client` — do not call directly unless testing.
