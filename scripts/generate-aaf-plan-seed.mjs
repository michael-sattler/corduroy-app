/**
 * Generates supabase/migrations/*_seed_aaf_q3_2026_plan.sql from
 * docs/corduroy_90day_plan_q3_2026.json
 *
 * Usage: node scripts/generate-aaf-plan-seed.mjs
 */

import { readFileSync, writeFileSync } from "fs";
import { createHash } from "crypto";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const planPath = resolve(repoRoot, "docs/corduroy_90day_plan_q3_2026.json");
const outPath = resolve(
  repoRoot,
  "supabase/migrations/20260710130000_seed_aaf_q3_2026_plan.sql",
);

const plan = JSON.parse(readFileSync(planPath, "utf8"));

const DEV_CLIENT_ID = "9811e315-7f2d-4484-9929-709900bb1bbd";
const LEGACY_CLIENT_NAMES = ["Acme Corp", "Acme"];

function sqlStr(value) {
  if (value === null || value === undefined) return "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

function sqlBool(value) {
  return value ? "true" : "false";
}

function stableUuid(kind, key) {
  const hash = createHash("sha256").update(`${kind}:${key}`).digest("hex");
  // 8-4-4-4-12 hex (RFC 4122 shape; version 4 + variant bits from hash)
  const uuid = `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(12, 15)}-8${hash.slice(15, 18)}-${hash.slice(18, 30)}`;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid)) {
    throw new Error(`Invalid uuid for ${kind}:${key}: ${uuid}`);
  }
  return uuid;
}

function sqlDollarJson(value, tag = "plan_json") {
  const body = JSON.stringify(value);
  return `$${tag}$${body}$${tag}$::jsonb`;
}

function mapOwner(owner) {
  if (!owner) return "client";
  const normalized = owner.toLowerCase();
  if (normalized === "antonio" || normalized === "client") return "client";
  if (normalized === "corduroy") return "corduroy";
  if (normalized === "both") return "both";
  return "client";
}

function mapCheckInStatus(status) {
  if (status === "completed") return "completed";
  if (status === "cancelled") return "cancelled";
  return "scheduled";
}

function inferUnit(label) {
  const lower = label.toLowerCase();
  if (lower.includes("rate") || lower.includes("%")) return "percent";
  if (lower.includes("revenue") || lower.includes("income") || lower.includes("cpl") || lower.includes("cost"))
    return "currency";
  if (lower.includes("contracts") || lower.includes("members") || lower.includes("leads"))
    return "count";
  return "ratio";
}

function inferFamily(label) {
  const lower = label.toLowerCase();
  if (lower.includes("revenue") || lower.includes("income") || lower.includes("margin"))
    return "profitability";
  if (lower.includes("renewal") || lower.includes("churn") || lower.includes("retention"))
    return "retention";
  if (lower.includes("lead") || lower.includes("conversion") || lower.includes("member") || lower.includes("cac") || lower.includes("cpl"))
    return "acquisition";
  return "productivity";
}

function metricKeyFromKpi(kpi) {
  return kpi.kpi_id.replace(/-/g, "_");
}

const ids = {
  plan: stableUuid("plan", plan.plan_id),
  goals: Object.fromEntries(plan.goals.map((g) => [g.goal_id, stableUuid("goal", g.goal_id)])),
  kpis: Object.fromEntries(plan.kpis.map((k) => [k.kpi_id, stableUuid("kpi", k.kpi_id)])),
  metrics: Object.fromEntries(plan.kpis.map((k) => [k.kpi_id, stableUuid("metric", k.kpi_id)])),
  clientMetrics: Object.fromEntries(
    plan.kpis.map((k) => [k.kpi_id, stableUuid("client_metric", k.kpi_id)]),
  ),
  initiatives: Object.fromEntries(
    plan.initiatives.map((i) => [i.initiative_id, stableUuid("initiative", i.initiative_id)]),
  ),
  months: Object.fromEntries(plan.months.map((m) => [m.month_id, stableUuid("month", m.month_id)])),
  weeks: {},
  checkIns: {},
  tasks: Object.fromEntries(plan.tasks.map((t) => [t.task_id, stableUuid("task", t.task_id)])),
};

for (const month of plan.months) {
  for (const week of month.weeks) {
    ids.weeks[week.week_id] = stableUuid("week", week.week_id);
  }
  if (month.check_in) {
    ids.checkIns[month.check_in.check_in_id] = stableUuid(
      "check_in",
      month.check_in.check_in_id,
    );
  }
}

const boundaryWeekIds = new Set(["week-005", "week-006", "week-010", "week-011"]);

const lines = [];
lines.push(`-- Seed: All-American Fitness Q3 2026 plan from docs/corduroy_90day_plan_q3_2026.json`);
lines.push(`-- Idempotent: safe to re-run (ON CONFLICT / upsert patterns).`);
lines.push(`-- Prerequisite: a client row must exist (npm run db:seed creates All-American Fitness).`);
lines.push("");
lines.push(`-- ---------------------------------------------------------------------------`);
lines.push(`-- Resolve client`);
lines.push(`-- ---------------------------------------------------------------------------`);
lines.push("");
lines.push(`do $$`);
lines.push(`declare`);
lines.push(`  v_client_id uuid;`);
lines.push(`  v_plan_row_id uuid := ${sqlStr(ids.plan)}::uuid;`);
lines.push(`  v_source_json jsonb;`);
lines.push(`begin`);
lines.push(`  v_source_json := ${sqlDollarJson(plan)};`);
lines.push("");
lines.push(`  select id into v_client_id`);
lines.push(`  from public.clients`);
lines.push(`  where id = ${sqlStr(DEV_CLIENT_ID)}::uuid`);
lines.push(`     or plan_client_id = ${sqlStr(plan.client.plan_client_id)}`);
lines.push(`     or name = ${sqlStr(plan.client.name)}`);
for (const legacyName of LEGACY_CLIENT_NAMES) {
  lines.push(`     or name = ${sqlStr(legacyName)}`);
}
lines.push(`  order by`);
lines.push(`    case`);
lines.push(`      when id = ${sqlStr(DEV_CLIENT_ID)}::uuid then 0`);
lines.push(`      when plan_client_id = ${sqlStr(plan.client.plan_client_id)} then 1`);
lines.push(`      when name = ${sqlStr(plan.client.name)} then 2`);
lines.push(`      else 3`);
lines.push(`    end`);
lines.push(`  limit 1;`);
lines.push("");
lines.push(`  if v_client_id is null then`);
lines.push(`    raise exception 'Client not found. Run: npm run db:seed (creates All-American Fitness / Acme Corp)';`);
lines.push(`  end if;`);
lines.push("");
lines.push(`  update public.clients set`);
lines.push(`    plan_client_id = ${sqlStr(plan.client.plan_client_id)},`);
lines.push(`    owner_name = ${sqlStr(plan.client.owner)},`);
lines.push(`    advisor_name = ${sqlStr(plan.client.advisor)},`);
lines.push(`    industry = ${sqlStr(plan.client.industry)},`);
lines.push(`    ccp = 3`);
lines.push(`  where id = v_client_id;`);
lines.push("");

// Plans
lines.push(`  insert into public.plans (`);
lines.push(`    id, client_id, plan_id, schema_version, period_start, period_end, status, source_json, generated_at`);
lines.push(`  ) values (`);
lines.push(`    v_plan_row_id,`);
lines.push(`    v_client_id,`);
lines.push(`    ${sqlStr(plan.plan_id)},`);
lines.push(`    ${sqlStr(plan.schema_version)},`);
lines.push(`    ${sqlStr(plan.client.plan_period.start_date)}::date,`);
lines.push(`    ${sqlStr(plan.client.plan_period.end_date)}::date,`);
lines.push(`    ${sqlStr(plan.plan_meta.status)},`);
lines.push(`    v_source_json,`);
lines.push(`    ${sqlStr(plan.generated_at)}::timestamptz`);
lines.push(`  )`);
lines.push(`  on conflict (client_id, plan_id) do update set`);
lines.push(`    schema_version = excluded.schema_version,`);
lines.push(`    period_start = excluded.period_start,`);
lines.push(`    period_end = excluded.period_end,`);
lines.push(`    status = excluded.status,`);
lines.push(`    source_json = excluded.source_json,`);
lines.push(`    generated_at = excluded.generated_at;`);
lines.push("");

// Goals
for (const goal of plan.goals) {
  lines.push(`  insert into public.plan_goals (id, plan_id, goal_id, label, description, target, priority)`);
  lines.push(`  values (`);
  lines.push(`    ${sqlStr(ids.goals[goal.goal_id])}::uuid,`);
  lines.push(`    v_plan_row_id,`);
  lines.push(`    ${sqlStr(goal.goal_id)},`);
  lines.push(`    ${sqlStr(goal.label)},`);
  lines.push(`    ${sqlStr(goal.description)},`);
  lines.push(`    ${sqlStr(goal.target)},`);
  lines.push(`    ${goal.priority}`);
  lines.push(`  ) on conflict (plan_id, goal_id) do update set`);
  lines.push(`    label = excluded.label, description = excluded.description,`);
  lines.push(`    target = excluded.target, priority = excluded.priority;`);
  lines.push("");
}

// Bespoke metrics + client_metrics + plan_kpis
for (const kpi of plan.kpis) {
  const mKey = metricKeyFromKpi(kpi);
  const baseline = kpi.baseline?.initial_value ?? null;
  const baselineEstablished = baseline !== null;
  lines.push(`  insert into public.metric_definitions (`);
  lines.push(`    id, client_id, metric_key, label, family, tier, kind, unit,`);
  lines.push(`    update_interval, benchmarkable, needs_review`);
  lines.push(`  ) values (`);
  lines.push(`    ${sqlStr(ids.metrics[kpi.kpi_id])}::uuid,`);
  lines.push(`    v_client_id,`);
  lines.push(`    ${sqlStr(mKey)},`);
  lines.push(`    ${sqlStr(kpi.label)},`);
  lines.push(`    ${sqlStr(inferFamily(kpi.label))},`);
  lines.push(`    'bespoke', 'observed', ${sqlStr(inferUnit(kpi.label))},`);
  lines.push(`    ${sqlStr(kpi.frequency)}, false, true`);
  lines.push(`  ) on conflict (client_id, metric_key) where (client_id is not null) do update set`);
  lines.push(`    label = excluded.label, update_interval = excluded.update_interval;`);
  lines.push("");
  lines.push(`  insert into public.client_metrics (id, client_id, definition_id, source_binding)`);
  lines.push(`  values (`);
  lines.push(`    ${sqlStr(ids.clientMetrics[kpi.kpi_id])}::uuid,`);
  lines.push(`    v_client_id,`);
  lines.push(`    ${sqlStr(ids.metrics[kpi.kpi_id])}::uuid,`);
  lines.push(`    ${sqlStr(kpi.source)}`);
  lines.push(`  ) on conflict (client_id, definition_id) do update set`);
  lines.push(`    source_binding = excluded.source_binding;`);
  lines.push("");
  lines.push(`  insert into public.plan_kpis (`);
  lines.push(`    id, plan_id, client_metric_id, kpi_id, baseline_snapshot,`);
  lines.push(`    baseline_established, target, review_cadence`);
  lines.push(`  ) values (`);
  lines.push(`    ${sqlStr(ids.kpis[kpi.kpi_id])}::uuid,`);
  lines.push(`    v_plan_row_id,`);
  lines.push(`    ${sqlStr(ids.clientMetrics[kpi.kpi_id])}::uuid,`);
  lines.push(`    ${sqlStr(kpi.kpi_id)},`);
  lines.push(`    ${baseline === null ? "null" : baseline},`);
  lines.push(`    ${sqlBool(baselineEstablished)},`);
  lines.push(`    ${sqlStr(kpi.target)},`);
  lines.push(`    ${sqlStr(kpi.frequency)}`);
  lines.push(`  ) on conflict (plan_id, kpi_id) do update set`);
  lines.push(`    baseline_snapshot = excluded.baseline_snapshot,`);
  lines.push(`    baseline_established = excluded.baseline_established,`);
  lines.push(`    target = excluded.target, review_cadence = excluded.review_cadence;`);
  lines.push("");
}

// KPI goal refs
for (const kpi of plan.kpis) {
  for (const goalRef of kpi.goal_refs ?? []) {
    lines.push(`  insert into public.kpi_goal_refs (plan_kpi_id, plan_goal_id)`);
    lines.push(`  values (`);
    lines.push(`    ${sqlStr(ids.kpis[kpi.kpi_id])}::uuid,`);
    lines.push(`    ${sqlStr(ids.goals[goalRef])}::uuid`);
    lines.push(`  ) on conflict do nothing;`);
  }
}

lines.push("");

// Initiatives
for (const init of plan.initiatives) {
  lines.push(`  insert into public.plan_initiatives (`);
  lines.push(`    id, plan_id, initiative_id, label, owner, success_criteria, budget_usd, status`);
  lines.push(`  ) values (`);
  lines.push(`    ${sqlStr(ids.initiatives[init.initiative_id])}::uuid,`);
  lines.push(`    v_plan_row_id,`);
  lines.push(`    ${sqlStr(init.initiative_id)},`);
  lines.push(`    ${sqlStr(init.label)},`);
  lines.push(`    ${sqlStr(mapOwner(init.owner))},`);
  lines.push(`    ${sqlStr(init.success_criteria)},`);
  lines.push(`    ${init.budget_usd ?? "null"},`);
  lines.push(`    ${sqlStr(init.status)}`);
  lines.push(`  ) on conflict (plan_id, initiative_id) do update set`);
  lines.push(`    label = excluded.label, owner = excluded.owner,`);
  lines.push(`    success_criteria = excluded.success_criteria,`);
  lines.push(`    budget_usd = excluded.budget_usd, status = excluded.status;`);
  lines.push("");
}

// Initiative KPI refs
for (const init of plan.initiatives) {
  for (const kpiRef of init.kpi_refs ?? []) {
    lines.push(`  insert into public.initiative_kpi_refs (initiative_id, plan_kpi_id)`);
    lines.push(`  values (`);
    lines.push(`    ${sqlStr(ids.initiatives[init.initiative_id])}::uuid,`);
    lines.push(`    ${sqlStr(ids.kpis[kpiRef])}::uuid`);
    lines.push(`  ) on conflict do nothing;`);
  }
}

lines.push("");

// Months, weeks, check-ins
for (const month of plan.months) {
  lines.push(`  insert into public.plan_months (`);
  lines.push(`    id, plan_id, month_id, name, start_date, end_date, theme`);
  lines.push(`  ) values (`);
  lines.push(`    ${sqlStr(ids.months[month.month_id])}::uuid,`);
  lines.push(`    v_plan_row_id,`);
  lines.push(`    ${sqlStr(month.month_id)},`);
  lines.push(`    ${sqlStr(month.name)},`);
  lines.push(`    ${sqlStr(month.start_date)}::date,`);
  lines.push(`    ${sqlStr(month.end_date)}::date,`);
  lines.push(`    ${sqlStr(month.theme)}`);
  lines.push(`  ) on conflict (plan_id, month_id) do update set`);
  lines.push(`    name = excluded.name, start_date = excluded.start_date,`);
  lines.push(`    end_date = excluded.end_date, theme = excluded.theme;`);
  lines.push("");

  for (const week of month.weeks) {
    lines.push(`  insert into public.plan_weeks (`);
    lines.push(`    id, month_id, week_id, week_number, start_date, end_date, is_boundary_week`);
    lines.push(`  ) values (`);
    lines.push(`    ${sqlStr(ids.weeks[week.week_id])}::uuid,`);
    lines.push(`    ${sqlStr(ids.months[month.month_id])}::uuid,`);
    lines.push(`    ${sqlStr(week.week_id)},`);
    lines.push(`    ${week.week_number},`);
    lines.push(`    ${sqlStr(week.start_date)}::date,`);
    lines.push(`    ${sqlStr(week.end_date)}::date,`);
    lines.push(`    ${sqlBool(boundaryWeekIds.has(week.week_id))}`);
    lines.push(`  ) on conflict (month_id, week_id) do update set`);
    lines.push(`    week_number = excluded.week_number, start_date = excluded.start_date,`);
    lines.push(`    end_date = excluded.end_date, is_boundary_week = excluded.is_boundary_week;`);
    lines.push("");
  }

  const ci = month.check_in;
  if (ci) {
    const weekUuid = ids.weeks[ci.scheduled_week_ref];
    lines.push(`  insert into public.plan_check_ins (`);
    lines.push(`    id, month_id, check_in_id, type, scheduled_week_id, agenda, status, notes, completed_at`);
    lines.push(`  ) values (`);
    lines.push(`    ${sqlStr(ids.checkIns[ci.check_in_id])}::uuid,`);
    lines.push(`    ${sqlStr(ids.months[month.month_id])}::uuid,`);
    lines.push(`    ${sqlStr(ci.check_in_id)},`);
    lines.push(`    ${sqlStr(ci.type)},`);
    lines.push(`    ${sqlStr(weekUuid)}::uuid,`);
    lines.push(`    ${sqlJson(ci.agenda)},`);
    lines.push(`    ${sqlStr(mapCheckInStatus(ci.status))},`);
    lines.push(`    ${ci.notes ? sqlStr(ci.notes) : "''"},`);
    lines.push(`    ${ci.completed_at ? `${sqlStr(ci.completed_at)}::timestamptz` : "null"}`);
    lines.push(`  ) on conflict (month_id, check_in_id) do update set`);
    lines.push(`    type = excluded.type, scheduled_week_id = excluded.scheduled_week_id,`);
    lines.push(`    agenda = excluded.agenda, status = excluded.status,`);
    lines.push(`    notes = excluded.notes, completed_at = excluded.completed_at;`);
    lines.push("");
  }
}

// Tasks + week refs
for (const task of plan.tasks) {
  const initUuid = task.initiative_ref
    ? `${sqlStr(ids.initiatives[task.initiative_ref])}::uuid`
    : "null";
  const checkInUuid = task.check_in_ref
    ? `${sqlStr(ids.checkIns[task.check_in_ref])}::uuid`
    : "null";

  lines.push(`  insert into public.plan_tasks (`);
  lines.push(`    id, plan_id, initiative_id, check_in_id, task_id, label, category,`);
  lines.push(`    owner, status, priority, is_recurring, is_meeting, deliverable, completed_at`);
  lines.push(`  ) values (`);
  lines.push(`    ${sqlStr(ids.tasks[task.task_id])}::uuid,`);
  lines.push(`    v_plan_row_id,`);
  lines.push(`    ${initUuid},`);
  lines.push(`    ${checkInUuid},`);
  lines.push(`    ${sqlStr(task.task_id)},`);
  lines.push(`    ${sqlStr(task.label)},`);
  lines.push(`    ${sqlStr(task.category)},`);
  lines.push(`    ${sqlStr(mapOwner(task.owner))},`);
  lines.push(`    ${sqlStr(task.status)},`);
  lines.push(`    ${sqlStr(task.priority)},`);
  lines.push(`    ${sqlBool(task.is_recurring)},`);
  lines.push(`    ${sqlBool(task.is_meeting)},`);
  lines.push(`    ${sqlStr(task.deliverable ?? "")},`);
  lines.push(`    ${task.completed_at ? `${sqlStr(task.completed_at)}::timestamptz` : "null"}`);
  lines.push(`  ) on conflict (plan_id, task_id) do update set`);
  lines.push(`    initiative_id = excluded.initiative_id, check_in_id = excluded.check_in_id,`);
  lines.push(`    label = excluded.label, category = excluded.category, owner = excluded.owner,`);
  lines.push(`    status = excluded.status, priority = excluded.priority,`);
  lines.push(`    is_recurring = excluded.is_recurring, is_meeting = excluded.is_meeting,`);
  lines.push(`    deliverable = excluded.deliverable, completed_at = excluded.completed_at;`);
  lines.push("");

  for (const weekRef of task.week_refs ?? []) {
    lines.push(`  insert into public.task_week_refs (plan_task_id, week_id)`);
    lines.push(`  select`);
    lines.push(`    ${sqlStr(ids.tasks[task.task_id])}::uuid,`);
    lines.push(`    pw.id`);
    lines.push(`  from public.plan_weeks pw`);
    lines.push(`  join public.plan_months pm on pm.id = pw.month_id`);
    lines.push(`  where pm.plan_id = v_plan_row_id`);
    lines.push(`    and pw.week_id = ${sqlStr(weekRef)}`);
    lines.push(`  on conflict do nothing;`);
  }
}

lines.push("");

// Budget
for (const alloc of plan.budget.allocations) {
  lines.push(`  insert into public.plan_budget_allocations (plan_id, category, monthly_usd, note)`);
  lines.push(`  select v_plan_row_id, ${sqlStr(alloc.category)}, ${alloc.monthly_usd}, ${sqlStr(alloc.note)}`);
  lines.push(`  where not exists (`);
  lines.push(`    select 1 from public.plan_budget_allocations pba`);
  lines.push(`    where pba.plan_id = v_plan_row_id and pba.category = ${sqlStr(alloc.category)}`);
  lines.push(`  );`);
}

lines.push("");

// Success criteria
for (const sc of plan.success_criteria) {
  const kpiUuid = sc.kpi_ref ? `${sqlStr(ids.kpis[sc.kpi_ref])}::uuid` : "null";
  lines.push(`  insert into public.plan_success_criteria (plan_id, plan_kpi_id, metric, target)`);
  lines.push(`  select v_plan_row_id, ${kpiUuid}, ${sqlStr(sc.metric)}, ${sqlStr(sc.target)}`);
  lines.push(`  where not exists (`);
  lines.push(`    select 1 from public.plan_success_criteria psc`);
  lines.push(`    where psc.plan_id = v_plan_row_id and psc.metric = ${sqlStr(sc.metric)}`);
  lines.push(`  );`);
}

// Audit observations from schema guide backfill note
const observations = [
  { kpi: "kpi-005", value: 23870, date: "2024-12-01" },
  { kpi: "kpi-005", value: 12800, date: "2025-12-01" },
  { kpi: "kpi-005", value: 18000, date: "2025-06-01" },
  { kpi: "kpi-012", value: 128000, date: "2024-12-31" },
  { kpi: "kpi-012", value: 96000, date: "2025-12-31" },
  { kpi: "kpi-011", value: 28000, date: "2025-06-01" },
  { kpi: "kpi-010", value: 1, date: "2025-06-01" },
  { kpi: "kpi-004", value: 1.5, date: "2025-01-01" },
];

for (const obs of observations) {
  lines.push(`  insert into public.metric_observations (`);
  lines.push(`    client_metric_id, value, observed_on, change_source, recorded_by`);
  lines.push(`  ) select`);
  lines.push(`    ${sqlStr(ids.clientMetrics[obs.kpi])}::uuid,`);
  lines.push(`    ${obs.value},`);
  lines.push(`    ${sqlStr(obs.date)}::date,`);
  lines.push(`    'agent_ingest', 'aaf_plan_seed'`);
  lines.push(`  where not exists (`);
  lines.push(`    select 1 from public.metric_observations mo`);
  lines.push(`    where mo.client_metric_id = ${sqlStr(ids.clientMetrics[obs.kpi])}::uuid`);
  lines.push(`      and mo.observed_on = ${sqlStr(obs.date)}::date`);
  lines.push(`      and mo.change_source = 'agent_ingest'`);
  lines.push(`      and mo.recorded_by = 'aaf_plan_seed'`);
  lines.push(`  );`);
}

lines.push("");
lines.push(`end $$;`);
lines.push("");

writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Wrote ${outPath}`);
console.log(`  Goals: ${plan.goals.length}`);
console.log(`  KPIs: ${plan.kpis.length}`);
console.log(`  Tasks: ${plan.tasks.length}`);
console.log(`  Weeks: ${Object.keys(ids.weeks).length}`);
