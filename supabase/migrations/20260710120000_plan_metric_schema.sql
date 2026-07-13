-- Plan + metric layer schema (corduroy_schema_guide_v2.md)
-- Extends public.clients; all new tables live in public (see docs/supabase-setup.md).

-- ---------------------------------------------------------------------------
-- Extend clients registry
-- ---------------------------------------------------------------------------

alter table public.clients
  add column if not exists plan_client_id text,
  add column if not exists external_client_id text,
  add column if not exists owner_name text,
  add column if not exists advisor_name text,
  add column if not exists ccp smallint
    check (ccp is null or (ccp >= 1 and ccp <= 10)),
  add column if not exists industry text;

create unique index if not exists clients_plan_client_id_uidx
  on public.clients (plan_client_id)
  where plan_client_id is not null;

comment on column public.clients.plan_client_id is
  'Stable string id used inside generated plan JSON (e.g. aaf-001).';
comment on column public.clients.external_client_id is
  'Optional FK to an external system of record; at launch often null or mirrors clients.id.';

-- ---------------------------------------------------------------------------
-- RLS helpers
-- ---------------------------------------------------------------------------

create or replace function public.can_access_client(p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_client_id = public.current_client_id()
    or public.staff_assigned_to(p_client_id)
    or public.is_approved_staff();
$$;

revoke all on function public.can_access_client(uuid) from public;
grant execute on function public.can_access_client(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Metric layer
-- ---------------------------------------------------------------------------

create table public.metric_definitions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete cascade,
  metric_key text not null,
  label text not null,
  family text not null
    check (family in (
      'profitability', 'liquidity', 'retention', 'acquisition', 'productivity'
    )),
  tier text not null
    check (tier in ('core', 'swap', 'bespoke')),
  kind text not null
    check (kind in ('observed', 'derived')),
  applicable_ccps jsonb not null default '[]',
  formula jsonb,
  unit text not null
    check (unit in ('currency', 'percent', 'count', 'days', 'ratio', 'months')),
  bound_min numeric,
  bound_max numeric,
  widget_type text not null default 'single_stat'
    check (widget_type in (
      'trend_line', 'bar', 'progress_to_goal', 'traffic_light', 'single_stat'
    )),
  palette text not null default 'default',
  update_interval text not null default 'monthly'
    check (update_interval in ('daily', 'weekly', 'monthly', 'quarterly')),
  benchmarkable boolean not null default false,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  check (benchmarkable = false or client_id is null),
  check (formula is null or kind = 'derived')
);

create unique index metric_definitions_library_key_uidx
  on public.metric_definitions (metric_key)
  where client_id is null;

create unique index metric_definitions_bespoke_key_uidx
  on public.metric_definitions (client_id, metric_key)
  where client_id is not null;

create index metric_definitions_needs_review_idx
  on public.metric_definitions (needs_review)
  where needs_review = true;

create table public.metric_inputs (
  derived_definition_id uuid not null
    references public.metric_definitions (id) on delete cascade,
  input_definition_id uuid not null
    references public.metric_definitions (id) on delete restrict,
  role text not null,
  primary key (derived_definition_id, input_definition_id, role),
  check (derived_definition_id <> input_definition_id)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  plan_id text not null,
  schema_version text not null default '2.0',
  period_start date not null,
  period_end date not null,
  status text not null default 'draft'
    check (status in ('draft', 'in_review', 'active', 'completed', 'archived')),
  source_json jsonb not null,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (client_id, plan_id),
  check (period_end >= period_start)
);

create index plans_client_status_idx
  on public.plans (client_id, status);

create table public.client_metrics (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  definition_id uuid not null references public.metric_definitions (id) on delete restrict,
  source_binding text not null default '',
  interval_override text
    check (
      interval_override is null
      or interval_override in ('daily', 'weekly', 'monthly', 'quarterly')
    ),
  current_value numeric,
  current_value_observed_on date,
  last_observed_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (client_id, definition_id)
);

create index client_metrics_client_active_idx
  on public.client_metrics (client_id)
  where is_active = true;

create table public.metric_observations (
  id uuid primary key default gen_random_uuid(),
  client_metric_id uuid not null
    references public.client_metrics (id) on delete cascade,
  value numeric not null,
  dimension jsonb not null default '{}',
  observed_on date not null,
  change_source text not null
    check (change_source in (
      'connector_sync',
      'manual_advisor',
      'manual_client',
      'agent_ingest',
      'reconciliation'
    )),
  recorded_by text not null default '',
  recorded_at timestamptz not null default now()
);

create index metric_observations_series_idx
  on public.metric_observations (client_metric_id, observed_on desc);

create index metric_observations_dimension_idx
  on public.metric_observations using gin (dimension);

create table public.dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  client_metric_id uuid not null
    references public.client_metrics (id) on delete cascade,
  widget_type text not null
    check (widget_type in (
      'trend_line', 'bar', 'progress_to_goal', 'traffic_light', 'single_stat'
    )),
  palette text not null default 'default',
  label_override text,
  dimension_filter jsonb not null default '{}',
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index dashboard_widgets_client_metric_sort_idx
  on public.dashboard_widgets (client_metric_id, sort_order);

create or replace function public.client_id_for_plan(p_plan_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.plans where id = p_plan_id;
$$;

create or replace function public.client_id_for_client_metric(p_client_metric_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from public.client_metrics where id = p_client_metric_id;
$$;

revoke all on function public.client_id_for_plan(uuid) from public;
revoke all on function public.client_id_for_client_metric(uuid) from public;
grant execute on function public.client_id_for_plan(uuid) to authenticated;
grant execute on function public.client_id_for_client_metric(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Plan layer
-- ---------------------------------------------------------------------------

create table public.plan_goals (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  goal_id text not null,
  label text not null,
  description text not null default '',
  target text not null default '',
  priority int not null default 0,
  unique (plan_id, goal_id)
);

create table public.plan_initiatives (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  initiative_id text not null,
  label text not null,
  owner text not null default 'client'
    check (owner in ('client', 'corduroy', 'both')),
  success_criteria text not null default '',
  budget_usd numeric
    check (budget_usd is null or budget_usd >= 0),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done', 'blocked')),
  unique (plan_id, initiative_id)
);

create table public.plan_months (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  month_id text not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  theme text not null default '',
  unique (plan_id, month_id),
  check (end_date >= start_date)
);

create table public.plan_weeks (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.plan_months (id) on delete cascade,
  week_id text not null,
  week_number int not null check (week_number >= 1),
  start_date date not null,
  end_date date not null,
  is_boundary_week boolean not null default false,
  unique (month_id, week_id),
  check (end_date >= start_date)
);

create table public.plan_check_ins (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.plan_months (id) on delete cascade,
  check_in_id text not null,
  type text not null
    check (type in ('month_end_review', 'milestone_review', 'ad_hoc')),
  scheduled_week_id uuid not null references public.plan_weeks (id) on delete restrict,
  agenda jsonb not null default '[]',
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  notes text not null default '',
  completed_at timestamptz,
  unique (month_id, check_in_id)
);

create table public.plan_kpis (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  client_metric_id uuid not null references public.client_metrics (id) on delete restrict,
  kpi_id text not null,
  baseline_snapshot numeric,
  baseline_established boolean not null default true,
  dimension_filter jsonb not null default '{}',
  target text not null default '',
  target_value numeric,
  review_cadence text not null default 'monthly'
    check (review_cadence in ('daily', 'weekly', 'monthly', 'quarterly')),
  unique (plan_id, kpi_id)
);

create table public.plan_tasks (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  initiative_id uuid references public.plan_initiatives (id) on delete set null,
  check_in_id uuid references public.plan_check_ins (id) on delete set null,
  task_id text not null,
  label text not null,
  category text not null default '',
  owner text not null default 'client'
    check (owner in ('client', 'corduroy', 'both')),
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'done', 'blocked', 'skipped')),
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  is_recurring boolean not null default false,
  is_meeting boolean not null default false,
  deliverable text not null default '',
  completed_at timestamptz,
  unique (plan_id, task_id)
);

create index plan_tasks_plan_status_idx
  on public.plan_tasks (plan_id, status);

create table public.kpi_goal_refs (
  plan_kpi_id uuid not null references public.plan_kpis (id) on delete cascade,
  plan_goal_id uuid not null references public.plan_goals (id) on delete cascade,
  primary key (plan_kpi_id, plan_goal_id)
);

create table public.initiative_kpi_refs (
  initiative_id uuid not null references public.plan_initiatives (id) on delete cascade,
  plan_kpi_id uuid not null references public.plan_kpis (id) on delete cascade,
  primary key (initiative_id, plan_kpi_id)
);

create table public.task_week_refs (
  plan_task_id uuid not null references public.plan_tasks (id) on delete cascade,
  week_id uuid not null references public.plan_weeks (id) on delete cascade,
  primary key (plan_task_id, week_id)
);

create table public.task_status_history (
  id uuid primary key default gen_random_uuid(),
  plan_task_id uuid not null references public.plan_tasks (id) on delete cascade,
  status_from text not null,
  status_to text not null,
  changed_by text not null default '',
  change_source text not null default 'manual_client',
  changed_at timestamptz not null default now()
);

create index task_status_history_task_changed_idx
  on public.task_status_history (plan_task_id, changed_at desc);

create table public.plan_budget_allocations (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  category text not null,
  monthly_usd numeric not null check (monthly_usd >= 0),
  note text not null default ''
);

create table public.plan_success_criteria (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans (id) on delete cascade,
  plan_kpi_id uuid references public.plan_kpis (id) on delete set null,
  metric text not null,
  target text not null
);

-- ---------------------------------------------------------------------------
-- Append-only enforcement
-- ---------------------------------------------------------------------------

create or replace function public.deny_row_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception '% is append-only', tg_table_name;
end;
$$;

create trigger metric_observations_deny_update
  before update on public.metric_observations
  for each row execute function public.deny_row_mutation();

create trigger metric_observations_deny_delete
  before delete on public.metric_observations
  for each row execute function public.deny_row_mutation();

create trigger task_status_history_deny_update
  before update on public.task_status_history
  for each row execute function public.deny_row_mutation();

create trigger task_status_history_deny_delete
  before delete on public.task_status_history
  for each row execute function public.deny_row_mutation();

-- ---------------------------------------------------------------------------
-- current_value cache on metric_observations insert
-- ---------------------------------------------------------------------------

create or replace function public.refresh_client_metric_current_value()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_priority int;
  v_existing_priority int;
  v_existing_id uuid;
begin
  v_priority := case new.change_source
    when 'connector_sync' then 4
    when 'manual_advisor' then 3
    when 'agent_ingest' then 2
    when 'manual_client' then 1
    else 0
  end;

  select mo.id,
    case mo.change_source
      when 'connector_sync' then 4
      when 'manual_advisor' then 3
      when 'agent_ingest' then 2
      when 'manual_client' then 1
      else 0
    end
  into v_existing_id, v_existing_priority
  from public.metric_observations mo
  where mo.client_metric_id = new.client_metric_id
    and mo.observed_on = new.observed_on
    and mo.dimension = new.dimension
    and mo.id <> new.id
  order by
    case mo.change_source
      when 'connector_sync' then 4
      when 'manual_advisor' then 3
      when 'agent_ingest' then 2
      when 'manual_client' then 1
      else 0
    end desc,
    mo.recorded_at desc
  limit 1;

  if v_existing_id is null or v_priority >= v_existing_priority then
    update public.client_metrics
    set
      current_value = new.value,
      current_value_observed_on = new.observed_on,
      last_observed_at = new.recorded_at
    where id = new.client_metric_id
      and (
        last_observed_at is null
        or new.recorded_at >= last_observed_at
        or v_priority >= coalesce(v_existing_priority, 0)
      );
  end if;

  return new;
end;
$$;

create trigger metric_observations_refresh_current_value
  after insert on public.metric_observations
  for each row execute function public.refresh_client_metric_current_value();

-- ---------------------------------------------------------------------------
-- Row level security (read paths; writes via service role for ingest)
-- ---------------------------------------------------------------------------

alter table public.metric_definitions enable row level security;
alter table public.metric_inputs enable row level security;
alter table public.plans enable row level security;
alter table public.client_metrics enable row level security;
alter table public.metric_observations enable row level security;
alter table public.dashboard_widgets enable row level security;
alter table public.plan_goals enable row level security;
alter table public.plan_initiatives enable row level security;
alter table public.plan_months enable row level security;
alter table public.plan_weeks enable row level security;
alter table public.plan_check_ins enable row level security;
alter table public.plan_kpis enable row level security;
alter table public.plan_tasks enable row level security;
alter table public.kpi_goal_refs enable row level security;
alter table public.initiative_kpi_refs enable row level security;
alter table public.task_week_refs enable row level security;
alter table public.task_status_history enable row level security;
alter table public.plan_budget_allocations enable row level security;
alter table public.plan_success_criteria enable row level security;

-- Library metrics: any authenticated principal; bespoke: client scope only
create policy "metric_definitions_select_library"
  on public.metric_definitions for select to authenticated
  using (client_id is null);

create policy "metric_definitions_select_bespoke"
  on public.metric_definitions for select to authenticated
  using (client_id is not null and public.can_access_client(client_id));

create policy "metric_inputs_select"
  on public.metric_inputs for select to authenticated
  using (true);

create policy "plans_select"
  on public.plans for select to authenticated
  using (public.can_access_client(client_id));

create policy "client_metrics_select"
  on public.client_metrics for select to authenticated
  using (public.can_access_client(client_id));

create policy "metric_observations_select"
  on public.metric_observations for select to authenticated
  using (
    public.can_access_client(public.client_id_for_client_metric(client_metric_id))
  );

create policy "dashboard_widgets_select"
  on public.dashboard_widgets for select to authenticated
  using (
    public.can_access_client(public.client_id_for_client_metric(client_metric_id))
  );

create policy "plan_goals_select"
  on public.plan_goals for select to authenticated
  using (public.can_access_client(public.client_id_for_plan(plan_id)));

create policy "plan_initiatives_select"
  on public.plan_initiatives for select to authenticated
  using (public.can_access_client(public.client_id_for_plan(plan_id)));

create policy "plan_months_select"
  on public.plan_months for select to authenticated
  using (public.can_access_client(public.client_id_for_plan(plan_id)));

create policy "plan_weeks_select"
  on public.plan_weeks for select to authenticated
  using (
    public.can_access_client(
      public.client_id_for_plan(
        (select pm.plan_id from public.plan_months pm where pm.id = plan_weeks.month_id)
      )
    )
  );

create policy "plan_check_ins_select"
  on public.plan_check_ins for select to authenticated
  using (
    public.can_access_client(
      public.client_id_for_plan(
        (select pm.plan_id from public.plan_months pm where pm.id = plan_check_ins.month_id)
      )
    )
  );

create policy "plan_kpis_select"
  on public.plan_kpis for select to authenticated
  using (public.can_access_client(public.client_id_for_plan(plan_id)));

create policy "plan_tasks_select"
  on public.plan_tasks for select to authenticated
  using (public.can_access_client(public.client_id_for_plan(plan_id)));

create policy "kpi_goal_refs_select"
  on public.kpi_goal_refs for select to authenticated
  using (
    public.can_access_client(
      public.client_id_for_plan(
        (select pk.plan_id from public.plan_kpis pk where pk.id = kpi_goal_refs.plan_kpi_id)
      )
    )
  );

create policy "initiative_kpi_refs_select"
  on public.initiative_kpi_refs for select to authenticated
  using (
    public.can_access_client(
      public.client_id_for_plan(
        (select pi.plan_id from public.plan_initiatives pi where pi.id = initiative_kpi_refs.initiative_id)
      )
    )
  );

create policy "task_week_refs_select"
  on public.task_week_refs for select to authenticated
  using (
    public.can_access_client(
      public.client_id_for_plan(
        (
          select pt.plan_id
          from public.plan_tasks pt
          where pt.id = task_week_refs.plan_task_id
        )
      )
    )
  );

create policy "task_status_history_select"
  on public.task_status_history for select to authenticated
  using (
    public.can_access_client(
      public.client_id_for_plan(
        (
          select pt.plan_id
          from public.plan_tasks pt
          where pt.id = task_status_history.plan_task_id
        )
      )
    )
  );

create policy "plan_budget_allocations_select"
  on public.plan_budget_allocations for select to authenticated
  using (public.can_access_client(public.client_id_for_plan(plan_id)));

create policy "plan_success_criteria_select"
  on public.plan_success_criteria for select to authenticated
  using (public.can_access_client(public.client_id_for_plan(plan_id)));

-- ---------------------------------------------------------------------------
-- Grants — SELECT for authenticated; ingest writes via service role
-- ---------------------------------------------------------------------------

grant select on public.metric_definitions to authenticated;
grant select on public.metric_inputs to authenticated;
grant select on public.plans to authenticated;
grant select on public.client_metrics to authenticated;
grant select on public.metric_observations to authenticated;
grant select on public.dashboard_widgets to authenticated;
grant select on public.plan_goals to authenticated;
grant select on public.plan_initiatives to authenticated;
grant select on public.plan_months to authenticated;
grant select on public.plan_weeks to authenticated;
grant select on public.plan_check_ins to authenticated;
grant select on public.plan_kpis to authenticated;
grant select on public.plan_tasks to authenticated;
grant select on public.kpi_goal_refs to authenticated;
grant select on public.initiative_kpi_refs to authenticated;
grant select on public.task_week_refs to authenticated;
grant select on public.task_status_history to authenticated;
grant select on public.plan_budget_allocations to authenticated;
grant select on public.plan_success_criteria to authenticated;
