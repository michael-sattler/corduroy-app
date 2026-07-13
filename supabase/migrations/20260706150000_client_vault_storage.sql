-- B4.1: Per-client Vault storage coordinates (S3 bucket + KMS key).
-- Runtime source of truth for AccessBroker / API — not terraform.tfvars.
-- v1: one primary bucket per client (TDD §5.1); table allows more later.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------

create table if not exists public.client_vault_storage (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  bucket_name text not null,
  kms_key_arn text not null,
  kms_alias_name text,
  aws_region text not null default 'us-east-1',
  purpose text not null default 'primary'
    check (purpose in ('primary', 'archive', 'migration')),
  status text not null default 'pending'
    check (status in ('pending', 'active', 'decommissioned')),
  provisioned_at timestamptz,
  created_at timestamptz not null default now(),
  unique (bucket_name),
  unique (client_id, purpose)
);

comment on table public.client_vault_storage is
  'AWS Vault storage for a client. Provision via IaC/API; read at runtime for pre-signed URLs.';

comment on column public.client_vault_storage.purpose is
  'primary = live Vault bucket; archive/migration reserved for future multi-bucket cases.';

create index if not exists client_vault_storage_client_id_idx
  on public.client_vault_storage (client_id);

-- ---------------------------------------------------------------------------
-- RLS — read via client/staff policies; writes via service role (provisioning)
-- ---------------------------------------------------------------------------

alter table public.client_vault_storage enable row level security;

drop policy if exists "client_vault_storage_select_client" on public.client_vault_storage;
create policy "client_vault_storage_select_client"
  on public.client_vault_storage
  for select
  to authenticated
  using (client_id = public.current_client_id());

drop policy if exists "client_vault_storage_select_assigned_staff" on public.client_vault_storage;
create policy "client_vault_storage_select_assigned_staff"
  on public.client_vault_storage
  for select
  to authenticated
  using (public.staff_assigned_to(client_id));

drop policy if exists "client_vault_storage_select_approved_staff" on public.client_vault_storage;
create policy "client_vault_storage_select_approved_staff"
  on public.client_vault_storage
  for select
  to authenticated
  using (public.is_approved_staff());

grant select on public.client_vault_storage to authenticated;

-- ---------------------------------------------------------------------------
-- Dev backfill: seed client provisioned via Terraform Phase 1.1.
-- Match by client_id (stable); name-based lookup fails if org was never renamed.

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
