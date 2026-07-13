-- Vault ↔ source-binding tags (many-to-many).
-- A vault object may be tagged with one or more of a client's active
-- client_metrics.source_binding values. Downstream, an extractor/LLM job
-- selects objects by matching source_binding to refresh the bound KPIs.
-- source_binding stays human-readable text here (schema guide: "human-readable
-- at launch; becomes a FK to a connector registry in Phase 2").

create table if not exists public.vault_object_source_bindings (
  id uuid primary key default gen_random_uuid(),
  vault_object_id uuid not null
    references public.vault_objects (id) on delete cascade,
  client_id uuid not null
    references public.clients (id) on delete cascade,
  source_binding text not null
    check (length(btrim(source_binding)) > 0),
  tagged_by uuid references auth.users (id) on delete set null,
  tagged_at timestamptz not null default now(),
  unique (vault_object_id, source_binding)
);

comment on table public.vault_object_source_bindings is
  'Many-to-many tags binding a vault object to a client source_binding (see client_metrics.source_binding). Consumed by KPI-refresh extraction jobs.';

comment on column public.vault_object_source_bindings.source_binding is
  'Human-readable source binding, mirrors client_metrics.source_binding. Matched by extractors to locate source documents for a metric.';

comment on column public.vault_object_source_bindings.client_id is
  'Denormalized from vault_objects for RLS and per-client lookups; must equal the object''s client_id.';

create index if not exists vault_object_source_bindings_object_idx
  on public.vault_object_source_bindings (vault_object_id);

create index if not exists vault_object_source_bindings_client_binding_idx
  on public.vault_object_source_bindings (client_id, source_binding);

-- ---------------------------------------------------------------------------
-- RLS — read own client / assigned staff / approved staff; write staff only
-- ---------------------------------------------------------------------------

alter table public.vault_object_source_bindings enable row level security;

drop policy if exists "vosb_select_client" on public.vault_object_source_bindings;
create policy "vosb_select_client"
  on public.vault_object_source_bindings
  for select
  to authenticated
  using (client_id = public.current_client_id());

drop policy if exists "vosb_select_assigned_staff" on public.vault_object_source_bindings;
create policy "vosb_select_assigned_staff"
  on public.vault_object_source_bindings
  for select
  to authenticated
  using (public.staff_assigned_to(client_id));

drop policy if exists "vosb_select_approved_staff" on public.vault_object_source_bindings;
create policy "vosb_select_approved_staff"
  on public.vault_object_source_bindings
  for select
  to authenticated
  using (public.is_approved_staff());

drop policy if exists "vosb_insert_assigned_staff" on public.vault_object_source_bindings;
create policy "vosb_insert_assigned_staff"
  on public.vault_object_source_bindings
  for insert
  to authenticated
  with check (public.staff_assigned_to(client_id));

drop policy if exists "vosb_insert_approved_staff" on public.vault_object_source_bindings;
create policy "vosb_insert_approved_staff"
  on public.vault_object_source_bindings
  for insert
  to authenticated
  with check (public.is_approved_staff());

drop policy if exists "vosb_delete_assigned_staff" on public.vault_object_source_bindings;
create policy "vosb_delete_assigned_staff"
  on public.vault_object_source_bindings
  for delete
  to authenticated
  using (public.staff_assigned_to(client_id));

drop policy if exists "vosb_delete_approved_staff" on public.vault_object_source_bindings;
create policy "vosb_delete_approved_staff"
  on public.vault_object_source_bindings
  for delete
  to authenticated
  using (public.is_approved_staff());

grant select, insert, delete on public.vault_object_source_bindings to authenticated;
