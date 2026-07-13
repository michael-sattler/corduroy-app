-- Vault catalog classification (database-only; S3 objects unchanged)

alter table public.vault_objects
  add column if not exists category text,
  add column if not exists is_latest boolean not null default false,
  add column if not exists is_ignored boolean not null default false,
  add column if not exists is_processed boolean not null default false,
  add column if not exists is_hidden boolean not null default false,
  add column if not exists classified_at timestamptz,
  add column if not exists classified_by uuid references auth.users (id) on delete set null;

comment on column public.vault_objects.category is
  'Staff-assigned category slug (see app vault-categories.json).';

comment on column public.vault_objects.is_latest is
  'Marks the current file for this source among repeated uploads over time.';

comment on column public.vault_objects.is_ignored is
  'When true, downstream processors should skip analysis (enforced later).';

comment on column public.vault_objects.is_processed is
  'When true, initial processor pass completed (set by processors later).';

comment on column public.vault_objects.is_hidden is
  'When true, row moves to collapsed Hidden section; S3 object unchanged.';

create index if not exists vault_objects_client_source_latest_idx
  on public.vault_objects (client_id, source)
  where is_latest;

create index if not exists vault_objects_client_hidden_created_idx
  on public.vault_objects (client_id, created_at desc)
  where is_hidden;

-- Only one is_latest per client + source
create or replace function public.vault_objects_enforce_single_latest()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.is_latest then
    update public.vault_objects
    set is_latest = false
    where client_id = NEW.client_id
      and source = NEW.source
      and id <> NEW.id
      and is_latest;
  end if;

  return NEW;
end;
$$;

drop trigger if exists vault_objects_single_latest on public.vault_objects;
create trigger vault_objects_single_latest
  before insert or update of is_latest on public.vault_objects
  for each row
  when (NEW.is_latest)
  execute function public.vault_objects_enforce_single_latest();

-- Staff may update classification fields only (RLS column restriction via WITH CHECK)
drop policy if exists "vault_objects_update_assigned_staff" on public.vault_objects;
create policy "vault_objects_update_assigned_staff"
  on public.vault_objects
  for update
  to authenticated
  using (public.staff_assigned_to(client_id))
  with check (public.staff_assigned_to(client_id));

drop policy if exists "vault_objects_update_approved_staff" on public.vault_objects;
create policy "vault_objects_update_approved_staff"
  on public.vault_objects
  for update
  to authenticated
  using (public.is_approved_staff())
  with check (public.is_approved_staff());

grant update (
  category,
  is_latest,
  is_ignored,
  is_processed,
  is_hidden,
  classified_at,
  classified_by
) on public.vault_objects to authenticated;
