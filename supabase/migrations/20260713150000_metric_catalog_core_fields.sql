-- Metric catalog: fields required to seed the universal core KPI library.
-- Adds the human catalog vocabulary (description, category, stock/flow, text
-- formula), expands `kind` to include the 'ratio' computation class, and makes
-- `family` optional (the core catalog groups by `category` instead).
-- See docs/scope-corekpis.md for the source list.

alter table public.metric_definitions
  add column if not exists description text not null default '',
  add column if not exists category text,
  add column if not exists stock_flow text
    check (stock_flow is null or stock_flow in ('stock', 'flow')),
  add column if not exists formula_expression text;

comment on column public.metric_definitions.description is
  'Human definition of what the metric measures and how to scope it.';
comment on column public.metric_definitions.category is
  'Domain grouping for the catalog (Financial, Membership, Customers, People, B2B Pipeline, ...). Orthogonal to family.';
comment on column public.metric_definitions.stock_flow is
  'Whether an observed metric is a point-in-time stock or a within-period flow. Null for derived/ratio metrics.';
comment on column public.metric_definitions.formula_expression is
  'Human-readable formula for derived/ratio metrics, referencing other metric_keys (e.g. "total_revenue - total_cogs").';

-- kind: add the 'ratio' computation class alongside observed/derived.
alter table public.metric_definitions
  drop constraint if exists metric_definitions_kind_check;
alter table public.metric_definitions
  add constraint metric_definitions_kind_check
    check (kind in ('observed', 'derived', 'ratio'));

-- The core catalog groups by category; family is no longer required.
alter table public.metric_definitions
  alter column family drop not null;

-- Structured jsonb formula (if ever set) is valid for derived OR ratio metrics.
-- The original constraint is table-level with a generated name; drop it by
-- matching its definition, then re-add the widened version.
do $$
declare
  v_conname text;
begin
  select conname into v_conname
  from pg_constraint
  where conrelid = 'public.metric_definitions'::regclass
    and contype = 'c'
    and pg_get_constraintdef(oid) ilike '%formula is null%';

  if v_conname is not null then
    execute format(
      'alter table public.metric_definitions drop constraint %I',
      v_conname
    );
  end if;
end $$;

alter table public.metric_definitions
  add constraint metric_definitions_formula_kind_check
    check (formula is null or kind in ('derived', 'ratio'));

create index if not exists metric_definitions_category_idx
  on public.metric_definitions (category);
