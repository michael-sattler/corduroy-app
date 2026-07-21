-- Vault document-analysis pipeline.
-- Jobs and events make asynchronous processing observable; candidates isolate
-- LLM-extracted metric values until a staff member explicitly approves them.

create table public.vault_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  vault_object_id uuid not null
    references public.vault_objects (id) on delete cascade,
  trigger text not null default 'ingest'
    check (trigger in ('ingest', 'staff_retry', 'staff_reanalyze')),
  idempotency_key text not null unique,
  status text not null default 'queued'
    check (status in (
      'queued', 'running', 'completed', 'failed', 'cancelled', 'unsupported'
    )),
  attempt_count integer not null default 0
    check (attempt_count >= 0),
  processor_version text not null default '',
  model_metadata jsonb not null default '{}',
  classification jsonb not null default '{}',
  error_code text,
  error_message text,
  queued_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  check (
    (status in ('queued', 'running') and finished_at is null)
    or status in ('completed', 'failed', 'cancelled', 'unsupported')
  )
);

comment on table public.vault_analysis_jobs is
  'Asynchronous, idempotent Vault document analysis jobs. Raw documents are processed only in the ContentProcessor retrieval layer.';
comment on column public.vault_analysis_jobs.idempotency_key is
  'Stable key for an upload event or an explicit staff re-analysis request; prevents duplicate queueing.';
comment on column public.vault_analysis_jobs.classification is
  'Safe structured classification result: document type, likely origin, and extraction summary. Never stores raw document content.';

create index vault_analysis_jobs_client_created_idx
  on public.vault_analysis_jobs (client_id, created_at desc);
create index vault_analysis_jobs_object_created_idx
  on public.vault_analysis_jobs (vault_object_id, created_at desc);
create index vault_analysis_jobs_active_idx
  on public.vault_analysis_jobs (status, queued_at)
  where status in ('queued', 'running');

create table public.vault_analysis_events (
  id bigint generated always as identity primary key,
  job_id uuid not null references public.vault_analysis_jobs (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  occurred_at timestamptz not null default now(),
  stage text not null
    check (stage in (
      'queued', 'download', 'inspect', 'extract_text', 'extract_tables',
      'classify', 'match_metrics', 'validate_candidates', 'complete', 'failed'
    )),
  level text not null default 'info'
    check (level in ('debug', 'info', 'warning', 'error')),
  message text not null,
  details jsonb not null default '{}'
);

comment on table public.vault_analysis_events is
  'Append-only safe operational trace for staff-visible Vault analysis logs. Details must exclude raw document content and private model reasoning.';

create index vault_analysis_events_job_occurred_idx
  on public.vault_analysis_events (job_id, occurred_at, id);
create index vault_analysis_events_client_occurred_idx
  on public.vault_analysis_events (client_id, occurred_at desc);

create table public.metric_observation_candidates (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  vault_analysis_job_id uuid not null
    references public.vault_analysis_jobs (id) on delete cascade,
  vault_object_id uuid not null
    references public.vault_objects (id) on delete cascade,
  client_metric_id uuid references public.client_metrics (id) on delete set null,
  metric_label text not null default '',
  value numeric not null,
  unit text not null default '',
  period_start date not null,
  period_end date not null,
  dimension jsonb not null default '{}',
  confidence numeric
    check (confidence is null or (confidence >= 0 and confidence <= 1)),
  evidence_excerpt text not null default '',
  evidence_locator jsonb not null default '{}',
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected', 'superseded')),
  review_note text not null default '',
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  published_observation_id uuid references public.metric_observations (id) on delete set null,
  created_at timestamptz not null default now(),
  check (period_end >= period_start),
  check (
    (status = 'pending_review' and reviewed_at is null and reviewed_by is null)
    or status in ('approved', 'rejected', 'superseded')
  )
);

comment on table public.metric_observation_candidates is
  'Review-first KPI values proposed from a Vault document. Only approved candidates are projected into immutable metric_observations.';
comment on column public.metric_observation_candidates.evidence_excerpt is
  'Minimal staff-reviewable source excerpt; never an entire raw document.';

create index metric_observation_candidates_job_idx
  on public.metric_observation_candidates (vault_analysis_job_id, created_at);
create index metric_observation_candidates_client_review_idx
  on public.metric_observation_candidates (client_id, status, created_at desc);

create or replace function public.approve_metric_observation_candidate(
  p_candidate_id uuid,
  p_reviewer_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate public.metric_observation_candidates%rowtype;
  observation_id uuid;
begin
  select *
    into candidate
    from public.metric_observation_candidates
    where id = p_candidate_id
    for update;

  if not found then
    raise exception 'Metric observation candidate not found';
  end if;

  if candidate.status <> 'pending_review' then
    raise exception 'Metric observation candidate has already been reviewed';
  end if;

  if candidate.client_metric_id is null then
    raise exception 'Candidate must be mapped to a client metric before approval';
  end if;

  insert into public.metric_observations (
    client_metric_id,
    value,
    dimension,
    observed_on,
    period_start,
    period_end,
    change_source,
    source_document
  )
  values (
    candidate.client_metric_id,
    candidate.value,
    candidate.dimension,
    candidate.period_end,
    candidate.period_start,
    candidate.period_end,
    'agent_ingest',
    format('vault:%s;cand:%s', candidate.vault_object_id, candidate.id)
  )
  returning id into observation_id;

  update public.metric_observation_candidates
    set status = 'approved',
        reviewed_by = p_reviewer_id,
        reviewed_at = now(),
        published_observation_id = observation_id
    where id = candidate.id;

  return observation_id;
end;
$$;

revoke all on function public.approve_metric_observation_candidate(uuid, uuid) from public;

-- Events are immutable. Jobs and candidates remain mutable only through
-- service-role processors and staff-authorized API actions.
create or replace function public.deny_vault_analysis_events_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'vault_analysis_events is append-only';
end;
$$;

create trigger vault_analysis_events_deny_update
  before update on public.vault_analysis_events
  for each row execute function public.deny_vault_analysis_events_mutation();
create trigger vault_analysis_events_deny_delete
  before delete on public.vault_analysis_events
  for each row execute function public.deny_vault_analysis_events_mutation();

alter table public.vault_analysis_jobs enable row level security;
alter table public.vault_analysis_events enable row level security;
alter table public.metric_observation_candidates enable row level security;

create policy "vault_analysis_jobs_select_staff"
  on public.vault_analysis_jobs for select to authenticated
  using (public.staff_assigned_to(client_id) or public.is_approved_staff());

create policy "vault_analysis_events_select_staff"
  on public.vault_analysis_events for select to authenticated
  using (public.staff_assigned_to(client_id) or public.is_approved_staff());

create policy "metric_observation_candidates_select_staff"
  on public.metric_observation_candidates for select to authenticated
  using (public.staff_assigned_to(client_id) or public.is_approved_staff());

grant select on public.vault_analysis_jobs to authenticated;
grant select on public.vault_analysis_events to authenticated;
grant select on public.metric_observation_candidates to authenticated;
