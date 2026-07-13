-- metric_observations: give every observation an explicit valid-time window.
-- A stock is the degenerate instant where period_start = period_end; a flow
-- covers the [period_start, period_end] range it accrued over. Also renames
-- recorded_by -> source_document (it names the source document, not an actor)
-- and repoints the series index onto the new read key (period_end).

begin;

-- 1. Valid-time window. Stock = degenerate instant where period_start = period_end.
alter table public.metric_observations
  add column period_start date,
  add column period_end   date;

-- 2. Backfill from observed_on (which was effectively the "as of" date).
--    Stocks are correct as-is; flow rows get a provisional zero-length
--    window and should be reviewed (see note below).
--    metric_observations is append-only (deny_row_mutation trigger), so the
--    backfill must temporarily disable that guard.
alter table public.metric_observations
  disable trigger metric_observations_deny_update;

update public.metric_observations
  set period_start = observed_on,
      period_end   = observed_on;

alter table public.metric_observations
  enable trigger metric_observations_deny_update;

-- 3. Lock down.
alter table public.metric_observations
  alter column period_start set not null,
  alter column period_end   set not null,
  add constraint metric_observations_period_chk
    check (period_end >= period_start);

-- 4. Rename the source-document column (was reading like an actor).
alter table public.metric_observations
  rename column recorded_by to source_document;

comment on column public.metric_observations.source_document is
  'Identifier of the source document/record the observation was read from (e.g. a connector sync id or seed tag). Not an actor.';
comment on column public.metric_observations.period_start is
  'Inclusive start of the observation''s valid-time window. Equals period_end for point-in-time stocks.';
comment on column public.metric_observations.period_end is
  'Inclusive end of the observation''s valid-time window; the "as of" date used for series ordering.';

-- 5. Repoint the series index onto the new read key.
drop index if exists public.metric_observations_series_idx;
create index metric_observations_series_idx
  on public.metric_observations (client_metric_id, period_end desc);

commit;
