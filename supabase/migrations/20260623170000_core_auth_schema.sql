-- Corduroy core auth schema (Milestone A2/A3)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.client_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create index client_users_client_id_idx on public.client_users (client_id);

create table public.staff (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('principal', 'advisor', 'admin')),
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id)
);

create table public.staff_assignments (
  staff_id uuid not null references public.staff (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (staff_id, client_id)
);

create index staff_assignments_client_id_idx on public.staff_assignments (client_id);

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id
  from public.client_users
  where user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_approved_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff
    where user_id = auth.uid()
      and approved = true
  );
$$;

create or replace function public.staff_assigned_to(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.staff s
    join public.staff_assignments sa on sa.staff_id = s.id
    where s.user_id = auth.uid()
      and s.approved = true
      and sa.client_id = p_client_id
  );
$$;

revoke all on function public.current_client_id() from public;
revoke all on function public.is_approved_staff() from public;
revoke all on function public.staff_assigned_to(uuid) from public;
grant execute on function public.current_client_id() to authenticated;
grant execute on function public.is_approved_staff() to authenticated;
grant execute on function public.staff_assigned_to(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.clients enable row level security;
alter table public.client_users enable row level security;
alter table public.staff enable row level security;
alter table public.staff_assignments enable row level security;

-- clients
create policy "clients_select_own"
  on public.clients
  for select
  to authenticated
  using (id = public.current_client_id());

create policy "clients_select_assigned_staff"
  on public.clients
  for select
  to authenticated
  using (public.staff_assigned_to(id));

-- client_users
create policy "client_users_select_self"
  on public.client_users
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "client_users_select_assigned_staff"
  on public.client_users
  for select
  to authenticated
  using (public.staff_assigned_to(client_id));

-- staff
create policy "staff_select_self"
  on public.staff
  for select
  to authenticated
  using (user_id = auth.uid());

-- staff_assignments
create policy "staff_assignments_select_self"
  on public.staff_assignments
  for select
  to authenticated
  using (
    staff_id in (
      select id from public.staff where user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Grants (RLS policies gate row access; these gate table access)
-- ---------------------------------------------------------------------------

grant select on public.clients to authenticated;
grant select on public.client_users to authenticated;
grant select on public.staff to authenticated;
grant select on public.staff_assignments to authenticated;
