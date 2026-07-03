-- B1 supplemental: organization logos and user avatars (filesystem paths + cache-bust timestamps)

alter table public.clients
  add column if not exists logo_path text,
  add column if not exists logo_updated_at timestamptz;

alter table public.client_users
  add column if not exists avatar_path text,
  add column if not exists avatar_updated_at timestamptz;

alter table public.staff
  add column if not exists avatar_path text,
  add column if not exists avatar_updated_at timestamptz;
