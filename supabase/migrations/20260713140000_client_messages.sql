-- Direct staff ↔ client messaging (asynchronous chat).
-- A durable thread of messages per client. Both an assigned/approved staff
-- member and the client's own users can read and post. Messages are immutable
-- (no update/delete) — the thread is an append-only conversation log.

create table if not exists public.client_messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null
    references public.clients (id) on delete cascade,
  sender_user_id uuid
    references auth.users (id) on delete set null,
  sender_role text not null
    check (sender_role in ('staff', 'client')),
  sender_name text not null default '',
  body text not null
    check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

comment on table public.client_messages is
  'Append-only asynchronous chat between Corduroy staff and a client. One row per message.';

comment on column public.client_messages.sender_role is
  'Which side sent the message: staff (Corduroy) or client.';

comment on column public.client_messages.sender_name is
  'Denormalized display name of the sender at send time (staff/client display name).';

create index if not exists client_messages_client_created_idx
  on public.client_messages (client_id, created_at);

-- ---------------------------------------------------------------------------
-- RLS — read: own client / assigned staff / approved staff.
--       insert: staff post as 'staff'; client posts as 'client' for own client.
-- ---------------------------------------------------------------------------

alter table public.client_messages enable row level security;

drop policy if exists "client_messages_select_client" on public.client_messages;
create policy "client_messages_select_client"
  on public.client_messages
  for select
  to authenticated
  using (client_id = public.current_client_id());

drop policy if exists "client_messages_select_assigned_staff" on public.client_messages;
create policy "client_messages_select_assigned_staff"
  on public.client_messages
  for select
  to authenticated
  using (public.staff_assigned_to(client_id));

drop policy if exists "client_messages_select_approved_staff" on public.client_messages;
create policy "client_messages_select_approved_staff"
  on public.client_messages
  for select
  to authenticated
  using (public.is_approved_staff());

drop policy if exists "client_messages_insert_staff" on public.client_messages;
create policy "client_messages_insert_staff"
  on public.client_messages
  for insert
  to authenticated
  with check (
    sender_user_id = auth.uid()
    and sender_role = 'staff'
    and (public.staff_assigned_to(client_id) or public.is_approved_staff())
  );

drop policy if exists "client_messages_insert_client" on public.client_messages;
create policy "client_messages_insert_client"
  on public.client_messages
  for insert
  to authenticated
  with check (
    sender_user_id = auth.uid()
    and sender_role = 'client'
    and client_id = public.current_client_id()
  );

grant select, insert on public.client_messages to authenticated;
