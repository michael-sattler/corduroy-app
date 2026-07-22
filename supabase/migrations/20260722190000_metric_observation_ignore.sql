alter table public.metric_observations
  add column if not exists is_ignored boolean not null default false,
  add column if not exists ignored_at timestamptz,
  add column if not exists ignored_by uuid references auth.users(id) on delete set null,
  add column if not exists ignore_note text not null default '',
  add column if not exists restored_at timestamptz,
  add column if not exists restored_by uuid references auth.users(id) on delete set null,
  add column if not exists restore_note text not null default '';

create index if not exists metric_observations_active_period_idx
  on public.metric_observations (client_metric_id, period_end desc)
  where is_ignored = false;

drop trigger if exists metric_observations_deny_update on public.metric_observations;

create or replace function public.guard_metric_observation_update()
returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - array[
    'is_ignored', 'ignored_at', 'ignored_by', 'ignore_note',
    'restored_at', 'restored_by', 'restore_note'
  ]) is distinct from (to_jsonb(old) - array[
    'is_ignored', 'ignored_at', 'ignored_by', 'ignore_note',
    'restored_at', 'restored_by', 'restore_note'
  ]) then
    raise exception 'metric observations are append-only; only ignore audit fields may change';
  end if;
  return new;
end;
$$;

create trigger metric_observations_guard_update
  before update on public.metric_observations
  for each row execute function public.guard_metric_observation_update();

create or replace function public.recompute_client_metric_current_value(
  p_client_metric_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_observation public.metric_observations%rowtype;
begin
  select *
  into v_observation
  from public.metric_observations
  where client_metric_id = p_client_metric_id
    and is_ignored = false
  order by
    case change_source
      when 'connector_sync' then 4
      when 'manual_advisor' then 3
      when 'agent_ingest' then 2
      when 'manual_client' then 1
      else 0
    end desc,
    recorded_at desc
  limit 1;

  update public.client_metrics
  set
    current_value = v_observation.value,
    current_value_observed_on = v_observation.observed_on,
    last_observed_at = v_observation.recorded_at
  where id = p_client_metric_id;
end;
$$;

create or replace function public.refresh_client_metric_current_value()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_ignored = false then
    perform public.recompute_client_metric_current_value(new.client_metric_id);
  end if;
  return new;
end;
$$;

create or replace function public.recompute_client_metric_current_value_on_ignore()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_ignored is distinct from new.is_ignored then
    perform public.recompute_client_metric_current_value(new.client_metric_id);
  end if;
  return new;
end;
$$;

create trigger metric_observations_recompute_on_ignore
  after update of is_ignored on public.metric_observations
  for each row execute function public.recompute_client_metric_current_value_on_ignore();
