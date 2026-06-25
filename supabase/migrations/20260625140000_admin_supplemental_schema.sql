-- B1 supplemental: prompt library, wait list, staff admin read policies

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.prompt_library (
  id text primary key,
  name text not null,
  version text not null default 'v1.0',
  body text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text not null,
  email text not null,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'scheduled', 'declined')),
  notes text not null default '',
  referral_source text not null default '',
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index waitlist_entries_submitted_at_idx
  on public.waitlist_entries (submitted_at desc);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.prompt_library enable row level security;
alter table public.waitlist_entries enable row level security;

create policy "prompt_library_staff_all"
  on public.prompt_library
  for all
  to authenticated
  using (public.is_approved_staff())
  with check (public.is_approved_staff());

create policy "waitlist_staff_all"
  on public.waitlist_entries
  for all
  to authenticated
  using (public.is_approved_staff())
  with check (public.is_approved_staff());

-- Approved staff can list peer staff rows (admin directory)
create policy "staff_select_approved_staff"
  on public.staff
  for select
  to authenticated
  using (public.is_approved_staff());

grant select, insert, update, delete on public.prompt_library to authenticated;
grant select, insert, update, delete on public.waitlist_entries to authenticated;

-- ---------------------------------------------------------------------------
-- Seed dev content (idempotent)
-- ---------------------------------------------------------------------------

insert into public.prompt_library (id, name, version, body)
values
  (
    'plan-generation',
    '90-day plan generation',
    'v3.2',
    'You are Corduroy''s 90-day plan generation assistant. Use the client audit and vault context to produce a complete plan JSON matching the Corduroy schema.'
  ),
  (
    'coach-injection',
    'Coach message injection',
    'v1.8',
    'You are Corduroy''s daily coaching assistant. Write concise, actionable coaching messages grounded in the client''s current plan and KPIs.'
  ),
  (
    'vault-extract',
    'Vault document extraction',
    'v2.0',
    'You extract structured facts from client documents uploaded to the Vault. Output normalized summaries suitable for plan generation.'
  ),
  (
    'review-queue',
    'Advisor review summary',
    'v1.1',
    'You summarize advisor review queue items and highlight plans that need attention before client delivery.'
  )
on conflict (id) do nothing;

insert into public.waitlist_entries (id, name, company, email, status, notes, referral_source, submitted_at)
values
  (
    'a1000000-0000-4000-8000-000000000042',
    'Sarah Mitchell',
    'Mitchell HVAC Services',
    'sarah@mitchellhvac.test',
    'new',
    'Interested in 90-day plan for commercial trades. Revenue ~$2M.',
    'corduroytech.ai — consultation form',
    '2026-03-24T10:00:00Z'
  ),
  (
    'a1000000-0000-4000-8000-000000000041',
    'David Chen',
    'Chen Commercial Roofing',
    'david@chenroofing.test',
    'contacted',
    '',
    'corduroytech.ai — consultation form',
    '2026-03-23T14:30:00Z'
  ),
  (
    'a1000000-0000-4000-8000-000000000040',
    'Angela Brooks',
    'Brooks Landscaping',
    'angela@brooksland.test',
    'scheduled',
    '',
    'corduroytech.ai — consultation form',
    '2026-03-21T09:15:00Z'
  ),
  (
    'a1000000-0000-4000-8000-000000000039',
    'Tom Reyes',
    'Reyes Auto Body',
    'tom@reyesauto.test',
    'declined',
    '',
    'corduroytech.ai — consultation form',
    '2026-03-19T16:45:00Z'
  )
on conflict (id) do nothing;
