-- B4: Vault catalog (vault_objects) and append-only audit log (audit_events)
-- TDD §5.5, §5.6, §7.1 — empty until Phase 1 ingestion writes rows.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.vault_objects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  s3_key text not null,
  prefix text not null
    check (prefix in ('raw', 'derived', 'context', 'audit')),
  object_type text not null default 'unknown',
  source text not null default '',
  size_bytes bigint
    check (size_bytes is null or size_bytes >= 0),
  created_at timestamptz not null default now(),
  unique (client_id, s3_key)
);

comment on table public.vault_objects is
  'Per-client S3 object catalog. One row per object; maintained by ingest and reconciliation (TDD §5.5).';

comment on column public.vault_objects.prefix is
  'Top-level Vault prefix: raw, derived, context, or audit.';

create index vault_objects_client_prefix_created_idx
  on public.vault_objects (client_id, prefix, created_at desc);

create index vault_objects_client_source_created_idx
  on public.vault_objects (client_id, source, created_at desc);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  status text not null default 'completed'
    check (status in ('pending', 'completed', 'failed')),
  s3_key text,
  s3_prefix text
    check (s3_prefix is null or s3_prefix in ('raw', 'derived', 'context', 'audit')),
  reason text not null default '',
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  check (
    (status = 'pending' and completed_at is null)
    or (status in ('completed', 'failed'))
  )
);

comment on table public.audit_events is
  'Append-only Vault access and write audit trail (TDD §5.6).';

create index audit_events_client_created_idx
  on public.audit_events (client_id, created_at desc);

create index audit_events_client_s3_key_created_idx
  on public.audit_events (client_id, s3_key, created_at desc)
  where s3_key is not null;

-- ---------------------------------------------------------------------------
-- Append-only enforcement for audit_events
-- ---------------------------------------------------------------------------

create or replace function public.deny_audit_events_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'audit_events is append-only';
end;
$$;

create trigger audit_events_deny_update
  before update on public.audit_events
  for each row
  execute function public.deny_audit_events_mutation();

create trigger audit_events_deny_delete
  before delete on public.audit_events
  for each row
  execute function public.deny_audit_events_mutation();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.vault_objects enable row level security;
alter table public.audit_events enable row level security;

-- vault_objects: read own client, assigned staff, or approved staff (admin console)
create policy "vault_objects_select_client"
  on public.vault_objects
  for select
  to authenticated
  using (client_id = public.current_client_id());

create policy "vault_objects_select_assigned_staff"
  on public.vault_objects
  for select
  to authenticated
  using (public.staff_assigned_to(client_id));

create policy "vault_objects_select_approved_staff"
  on public.vault_objects
  for select
  to authenticated
  using (public.is_approved_staff());

-- audit_events: same read scope; writes via service role (Lambdas / API) only
create policy "audit_events_select_client"
  on public.audit_events
  for select
  to authenticated
  using (client_id = public.current_client_id());

create policy "audit_events_select_assigned_staff"
  on public.audit_events
  for select
  to authenticated
  using (public.staff_assigned_to(client_id));

create policy "audit_events_select_approved_staff"
  on public.audit_events
  for select
  to authenticated
  using (public.is_approved_staff());

-- ---------------------------------------------------------------------------
-- Grants — SELECT for authenticated; INSERT/UPDATE via service role (Phase 1)
-- ---------------------------------------------------------------------------

grant select on public.vault_objects to authenticated;
grant select on public.audit_events to authenticated;
