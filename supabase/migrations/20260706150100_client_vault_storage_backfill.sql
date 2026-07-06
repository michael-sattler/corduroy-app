-- Repair: backfill client_vault_storage for dev seed client (idempotent).
-- Original migration matched on name; use client_id from Terraform vault_clients.

insert into public.client_vault_storage (
  client_id,
  bucket_name,
  kms_key_arn,
  kms_alias_name,
  aws_region,
  purpose,
  status,
  provisioned_at
)
select
  c.id,
  'corduroy-dev-vault-9811e3157f2d44849929709900bb1bbd',
  'arn:aws:kms:us-east-1:789535501521:key/a971ceda-98fe-4e7a-aa4c-20f7df37fd5a',
  'alias/corduroy-dev-vault-9811e3157f2d44849929709900bb1bbd',
  'us-east-1',
  'primary',
  'active',
  now()
from public.clients c
where c.id = '9811e315-7f2d-4484-9929-709900bb1bbd'
on conflict (client_id, purpose) do update
set
  bucket_name = excluded.bucket_name,
  kms_key_arn = excluded.kms_key_arn,
  kms_alias_name = excluded.kms_alias_name,
  aws_region = excluded.aws_region,
  status = excluded.status,
  provisioned_at = excluded.provisioned_at;
