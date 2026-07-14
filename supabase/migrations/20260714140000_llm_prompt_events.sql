-- Append-only log of client LLM assistant turns (user prompts).
-- Used by staff dashboard "Recent activity" LLM message counts.

create table if not exists public.llm_prompt_events (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null
    references public.clients (id) on delete cascade,
  user_id uuid
    references auth.users (id) on delete set null,
  surface text not null
    check (surface in ('client', 'staff')),
  created_at timestamptz not null default now()
);

comment on table public.llm_prompt_events is
  'One row per user prompt sent to an embedded Corduroy LLM assistant.';

create index if not exists llm_prompt_events_client_created_idx
  on public.llm_prompt_events (client_id, created_at desc);

alter table public.llm_prompt_events enable row level security;

drop policy if exists "llm_prompt_events_select_client" on public.llm_prompt_events;
create policy "llm_prompt_events_select_client"
  on public.llm_prompt_events
  for select
  to authenticated
  using (client_id = public.current_client_id());

drop policy if exists "llm_prompt_events_select_assigned_staff" on public.llm_prompt_events;
create policy "llm_prompt_events_select_assigned_staff"
  on public.llm_prompt_events
  for select
  to authenticated
  using (public.staff_assigned_to(client_id));

drop policy if exists "llm_prompt_events_select_approved_staff" on public.llm_prompt_events;
create policy "llm_prompt_events_select_approved_staff"
  on public.llm_prompt_events
  for select
  to authenticated
  using (public.is_approved_staff());

drop policy if exists "llm_prompt_events_insert_client" on public.llm_prompt_events;
create policy "llm_prompt_events_insert_client"
  on public.llm_prompt_events
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and surface = 'client'
    and client_id = public.current_client_id()
  );
