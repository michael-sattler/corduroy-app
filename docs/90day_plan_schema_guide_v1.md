# 90-Day Plan — Schema Guide

**Companion document to:** `aaf_90day_plan_q3_2026.json`
**Version:** 1.0
**Last updated:** July 2026
**Owner:** Corduroy Technologies — Platform Engineering

---

## Purpose of this document

This guide explains the relational schema that backs the Corduroy 90-Day Plan module. It exists so that a future engineer — or a future version of the team — can understand not just *what* the tables are, but *why* they are shaped this way and what tradeoffs were considered and rejected.

The 90-Day Plan has an unusual lifecycle that drives most of the schema decisions:

1. A **JSON object is generated once** by an LLM from a client's Audit document.
2. That JSON is **ingested into Postgres**, which becomes the source of truth for live state.
3. The dashboard **renders from Postgres**, not from the JSON.
4. The original JSON is **retained as an immutable milestone artifact**.
5. Subsequent updates happen **element-by-element** in Postgres — the plan is never fully regenerated.

Every design choice below serves that lifecycle.

---

## Governing principles

**Generate once, update forever.**
The JSON is a generation and transport format. It is never the live record. Once ingested, no process writes back into the JSON — new JSON is only produced at milestone boundaries (month-end reviews, quarter close) as an export.

**Write-once baselines, mutable current values.**
Any stateful element carries both an `initial_value` (write-once, set at ingest, never updated) and a `current_value` (mutable). This lets the dashboard always show progress against the original baseline, even after months of updates. Losing the baseline would make progress unmeasurable.

**Append-only history, never in-place mutation.**
Status changes and metric updates append rows to history tables. Nothing is overwritten. This gives the advisor a complete audit trail and lets the coaching layer reason about velocity ("this task has been In Progress for three weeks").

**Dual identifiers on every entity.**
Every table has an internal `uuid id` primary key and an external string identifier (`task_id`, `kpi_id`, etc.) carried over from the JSON. Foreign keys use the UUID. The string IDs are what the LLM generates and what exports reference. This decoupling is what allows a plan to round-trip — generate → ingest → export → regenerate — without identifier collisions across clients.

**No cross-client access at any layer.**
Every table that holds client data reaches `clients` through `plans`. Row-level security policies key off `plans.client_id`. No principal, human or agent, holds a credential that spans clients.

---

## Table reference

### `clients`

**Purpose:** The client registry. One row per SMB engaged with Corduroy.

**Why it exists separately from `plans`:** A client will have multiple plans over time — one per 90-day cycle. Client identity, advisor assignment, and industry classification persist across plans; plan-specific data does not.

**Notable columns:**

| Column | Notes |
|---|---|
| `plan_client_id` | The internal string identifier used inside generated JSON (e.g. `aaf-001`). Stable across all plans for this client. |
| `external_client_id` | Foreign key into whatever system of record eventually holds client accounts (CRM, billing). Nullable at launch. |
| `advisor_name` | Denormalized for now. Becomes a FK to a `staff` table once the advisor console is built. |

**Considered and rejected:** Storing the client's industry as a foreign key to a taxonomy table. At five clients this is premature; a string column is sufficient until the CCP segmentation framework stabilizes and we know what the taxonomy actually needs to be.

---

### `plans`

**Purpose:** One row per 90-day plan generated for a client. The root of every plan-scoped query.

**Why it exists:** It is the join point for RLS policies and the container for the immutable JSON snapshot.

**Notable columns:**

| Column | Notes |
|---|---|
| `source_json` | `jsonb`. The complete, unmodified JSON as generated. This is the milestone artifact. Never written to after insert. |
| `schema_version` | Lets the ingest pipeline handle older plans when the schema evolves. |
| `status` | `draft` / `in_review` / `active` / `completed` / `archived`. Advisor review gates the transition from `in_review` to `active`. |
| `period_start` / `period_end` | The 90-day window. Used to compute "current week" for the dashboard. |

**Why `source_json` lives here rather than in object storage:** It is small (~50 KB), queried alongside plan metadata, and needs the same access controls. Pushing it to the Vault would add a retrieval hop for no benefit. Larger artifacts — the Audit document itself, the generated Word doc — do belong in the Vault.

**Regeneration behavior:** A new 90-day cycle creates a *new* `plans` row with a new `source_json`. The prior row is set to `archived` and retained indefinitely. Plans are never updated in place.

---

### `plan_goals`

**Purpose:** The three-to-five top-level business objectives the plan serves. For All-American Fitness: membership growth, revenue stabilization, marketing accountability.

**Why it exists:** Goals are the top of the traceability chain. Every KPI rolls up to at least one goal; every initiative rolls up to at least one goal. When an advisor asks "why are we doing this task," the chain is `task → initiative → goal`.

**Notable columns:**

| Column | Notes |
|---|---|
| `priority` | Integer ordering. Drives display order on the dashboard and, later, escalation weighting in the coaching layer. |
| `target` | Free text. Deliberately not structured — goal targets are qualitative as often as they are numeric ("close the year-over-year gap"). The numeric version lives on the linked KPI. |

---

### `plan_kpis`

**Purpose:** The measurable metrics the plan tracks. Sources, baselines, targets, and refresh frequency.

**Why it exists:** This is the table the KPI Dashboard renders from, and the one the coaching layer reads to detect drift.

**Notable columns:**

| Column | Notes |
|---|---|
| `initial_value` | Write-once. Set at ingest from the audit baseline. Nullable — many AAF baselines are genuinely unknown because nothing was being tracked. |
| `current_value` | Mutable. Updated by the reconciliation job, by manual advisor entry, or eventually by connector sync. |
| `source` | Where the number comes from ("Lead Log — Google Sheet", "QuickBooks"). Human-readable at launch; becomes a FK to a connector registry in Phase 2. |
| `frequency` | `weekly` / `monthly` / `quarterly`. Drives staleness alerting — a weekly KPI untouched for ten days is flagged. |

**A note on null baselines:** Nine of the thirteen AAF KPIs have a null `initial_value` because the business had no tracking in place. This is not a data quality problem to be fixed at ingest — it is a *finding*. The dashboard should render these as "Baseline: not yet established" and treat the first recorded value as the de facto baseline, flagged as such. Silently backfilling zeros would misrepresent progress.

---

### `kpi_history`

**Purpose:** Append-only log of every recorded value for every KPI.

**Why it exists:** `plan_kpis.current_value` answers "what is it now." This table answers "how did it get there." Trend lines, progress-to-goal charts, and velocity calculations all read from here.

**Notable columns:**

| Column | Notes |
|---|---|
| `change_source` | Enum: `manual_advisor` / `manual_client` / `connector_sync` / `agent_ingest` / `reconciliation`. Essential for the source-priority rule below. |
| `recorded_at` | When the value was observed, not when the row was written. These differ when backfilling. |

**Source priority rule:** When two updates for the same KPI and same observation date arrive from different sources, precedence is `connector_sync` > `manual_advisor` > `agent_ingest` > `manual_client`. Both rows are retained; the higher-priority one becomes `current_value`. This handles the common case where a client self-reports a number and QuickBooks later contradicts it.

---

### `kpi_goal_refs`

**Purpose:** Junction table. Maps KPIs to the goals they measure.

**Why it exists:** The relationship is genuinely many-to-many. "New Members Signed" serves membership growth. "Marketing CPL" serves marketing accountability. "MHS Leads Generated" serves both membership growth *and* marketing accountability. A single FK on `plan_kpis` would have forced an arbitrary choice.

---

### `plan_initiatives`

**Purpose:** The strategic buckets that group tasks. For AAF: MHS Lead Funnel, B2B Expansion, PIF Renewal System, Lead Tracking.

**Why it exists:** Initiatives are the unit at which a client thinks about the plan ("how's the B2B push going?") and the unit at which the advisor assesses progress. Tasks are too granular; goals are too abstract.

**Notable columns:**

| Column | Notes |
|---|---|
| `owner` | `client` / `corduroy` / `both`. The default owner for tasks under this initiative; individual tasks can override. |
| `success_criteria` | Free text. The plain-language definition of done. |
| `budget_usd` | Allocated spend. Rolls up for budget-vs-actual reporting. |
| `status` | Derived, not authoritative. Computed from child task statuses on read. Stored only as a cache. |

**Why `status` is a cached derivation:** An initiative is `done` when all its tasks are `done`. Computing this on every read is cheap at SMB scale but the column exists so the dashboard can sort and filter without a subquery. It is recomputed on any child task status change.

---

### `initiative_kpi_refs`

**Purpose:** Junction table. Maps initiatives to the KPIs that measure their success.

**Why it exists:** Same reason as `kpi_goal_refs` — the MHS Lead Funnel initiative is measured by both "MHS Leads Generated" and "MHS to Paid Conversion." The Lead Tracking initiative is measured by four separate KPIs.

---

### `plan_months`

**Purpose:** The three monthly containers. Each carries a theme and a month-end check-in.

**Why it exists:** The plan's narrative structure is monthly — Foundation, Conversion, Scale. Months are also the natural boundary for milestone JSON export and for the advisor's formal review cadence.

**Notable columns:**

| Column | Notes |
|---|---|
| `theme` | The one-line strategic framing ("Foundation — get systems live"). Rendered as the section header on the dashboard. |

---

### `plan_weeks`

**Purpose:** The fifteen calendar weeks the plan spans. Sunday-to-Saturday boundaries.

**Why it exists:** Weeks are the scheduling unit for tasks and the column axis of the calendar grid.

**The straddling-week problem:** Calendar weeks do not respect month boundaries. The week of July 26 – August 1 belongs to both July and August. Two options were considered:

- **Duplicate the week row** under each month. Simple, matches the printed document, but the same calendar week has two `week_id` values and a task scheduled in it may appear twice.
- **Promote weeks to a direct child of `plans`** with a nullable `month_id`. Cleaner data, but the calendar grid must handle a week rendering in two month views.

**Decision:** Duplicate the row, accept the redundancy, and let the ingest pipeline flag straddling weeks with a `is_boundary_week` boolean. Rationale: the dashboard's primary view is monthly, and a duplicated row makes the monthly render trivial. The cost — a task appearing in two grids — is a display concern the client will read as correct, because the task genuinely does span that week.

---

### `plan_check_ins`

**Purpose:** The scheduled meetings between client and advisor. Two month-end reviews and one 90-day milestone review.

**Why it exists:** Check-ins are not tasks. They have agendas, participants, outcomes, and notes. They are the human-in-the-loop touchpoints that the entire accountability model rests on, and they need first-class representation.

**Notable columns:**

| Column | Notes |
|---|---|
| `type` | `month_end_review` / `milestone_review` / `ad_hoc`. Ad-hoc check-ins are created by advisor escalation, not by the plan generator. |
| `agenda` | `jsonb` array of strings. Structured enough to render as a checklist, loose enough that the advisor can add items. |
| `scheduled_week_id` | FK to `plan_weeks`. Which week the meeting falls in. |
| `completed_at` | Null until the meeting happens. A check-in past its week with a null `completed_at` is an escalation trigger. |

**Why check-ins also appear as rows in `plan_tasks`:** They need to render in the calendar grid alongside every other task. The task row carries `check_in_id` as a nullable FK, pointing back to the richer object. This is a deliberate denormalization — the alternative was a polymorphic union in the grid query, which is worse.

---

### `plan_tasks`

**Purpose:** The atomic unit of work. Fifty-seven rows for the AAF plan. The primary interactive element of the client dashboard.

**Why it exists:** This is where the client spends their time. Everything else in the schema is context for this table.

**Notable columns:**

| Column | Notes |
|---|---|
| `status` | `not_started` / `in_progress` / `done` / `blocked` / `skipped`. The toggle the client interacts with. |
| `owner` | `client` / `corduroy` / `both`. Drives filtering ("show me only my tasks") and the color coding in the grid. |
| `initiative_id` | **Nullable.** Check-in and milestone-review tasks belong to no initiative. |
| `check_in_id` | **Nullable.** Set only on tasks that represent meetings. |
| `is_recurring` | True for tasks that repeat weekly (daily lead logging, Monday reviews). Affects how completion is interpreted — a recurring task is never permanently `done`. |
| `is_meeting` | Renders differently in the grid. Distinct from `check_in_id` because some meetings (the GloFox support call) are not formal check-ins. |
| `deliverable` | The concrete artifact or observable outcome. Visible to the advisor; optionally surfaced to the client. |
| `priority` | `high` / `medium` / `low`. Drives the coaching layer's daily briefing ordering. |

**On recurring tasks:** A task with `is_recurring: true` and four `week_refs` is one row, not four. The dashboard fans it out on render. Completion state for recurring tasks is tracked per-week in `task_status_history` rather than on the task row — the `status` column reflects the *current* week's state. This was the single most contested decision in the schema. The alternative — materializing one row per occurrence — makes completion trivially simple but bloats the table and breaks the "one task, one identity" model the plan generator produces.

---

### `task_week_refs`

**Purpose:** Junction table. Maps tasks to the weeks in which they are scheduled.

**Why it exists:** A task can span multiple weeks. "Distribute MHS cards at every session" runs from week 2 through week 5. "Follow up on B2B proposals" spans weeks 8 and 9. A single `week_id` FK on `plan_tasks` would have forced duplicate task rows, breaking the one-task-one-identity principle.

**This is the table the calendar grid queries.** The month view joins `plan_weeks` to `task_week_refs` to `plan_tasks`, producing exactly the checkmark matrix in the printed document.

---

### `task_status_history`

**Purpose:** Append-only log of every status transition on every task.

**Why it exists:** Three consumers.

1. **The advisor console** — "which tasks did the client touch this week?"
2. **The coaching layer** — "this task has been `in_progress` for eighteen days; flag it."
3. **The audit trail** — every client-facing change is attributable.

**Notable columns:**

| Column | Notes |
|---|---|
| `status_from` / `status_to` | Both recorded. Reconstructing the sequence from `status_to` alone is possible but fragile. |
| `changed_by` | User identifier. Distinguishes client self-report from advisor override. |
| `change_source` | Enum: `client_dashboard` / `advisor_console` / `coaching_agent` / `system_reconciliation`. |
| `changed_at` | Server timestamp. |

**For recurring tasks, this table carries the per-week completion state.** A row with `status_to: 'done'` and a `changed_at` inside week 3's date range means the recurring task was completed for week 3. The grid derives per-week checkmarks from this.

---

### `plan_budget_allocations`

**Purpose:** The monthly marketing budget, broken out by category.

**Why it exists:** Budget-vs-actual is a KPI the client cares about, and reallocation decisions ("cut Valpak, move it to referrals") are explicit tasks in the plan. The categories need to be addressable.

**Notable columns:**

| Column | Notes |
|---|---|
| `monthly_usd` | The allocated amount. Actual spend, when we start tracking it, goes in a sibling `budget_actuals` table rather than mutating this row. |
| `note` | The decision rule ("if CPL exceeds $50 with no conversions, reallocate"). Rendered as a tooltip. |

**Deliberately flat.** No hierarchy, no sub-categories. Five rows. When a client's budget structure genuinely requires nesting, that is the signal to revisit — not before.

---

### `plan_success_criteria`

**Purpose:** The 90-day scorecard. What "done" looks like at the end of the cycle.

**Why it exists:** Distinct from `plan_kpis` because a success criterion is a *statement about a KPI at a point in time*, not the KPI itself. "PIF renewal rate" is a KPI tracked monthly. "80%+ renewal rate with zero surprise expirations by August 31" is a success criterion.

**Notable columns:**

| Column | Notes |
|---|---|
| `kpi_id` | **Nullable.** Some criteria are not numeric ("GloFox decision made"). These have no KPI to evaluate against and are assessed by the advisor at the milestone review. |
| `target` | Free text, deliberately. The scorecard is read by a human. |

---

## Access model

Both the client dashboard and the advisor console read the same tables. They differ in row filters and column projections, enforced by row-level security on `plans.client_id`.

**Client dashboard reads:**
`plan_tasks` (label, owner, status, week refs), `plan_kpis` (label, current_value, target), `plan_initiatives` (label, status), `plan_months`, `plan_weeks`, `plan_check_ins` (label, scheduled week).

**Advisor console additionally reads:**
`task_status_history`, `kpi_history`, `plan_check_ins.agenda` and `.notes`, `plan_tasks.priority` and `.deliverable`, `plans.source_json`.

**Neither writes to `plans.source_json`.** Only the ingest pipeline does, once, at plan creation.

---

## Ingest and export

**Ingest** (JSON → Postgres) runs once per plan, inside a single transaction:

1. Insert `plans` with `source_json` and `status: 'draft'`.
2. Insert goals, KPIs, initiatives, months, weeks, check-ins — resolving string IDs to UUIDs as it goes.
3. Insert tasks, resolving `initiative_ref` and `check_in_ref` to UUIDs.
4. Populate the three junction tables from the ref arrays.
5. Populate `plan_budget_allocations` and `plan_success_criteria`.
6. Validate: every `*_ref` in the JSON resolved to a real row. Any unresolved reference aborts the transaction.

**Export** (Postgres → JSON) runs at month-end reviews and quarter close. It reads live state and emits a JSON object matching the same schema, which is stored as a new milestone artifact in the Vault. This export is *not* written back to `plans.source_json` — that column always holds the original generation.

---

## Open questions

**Recurring task completion.** The current model tracks per-week completion in `task_status_history`. This works but makes "is this task done for this week" a query rather than a column read. If the coaching layer needs that answer on every daily briefing across every client, a materialized `task_week_completions` table may be warranted. Defer until the query is actually slow.

**Straddling weeks.** The duplicate-row decision above should be revisited after the first client sees the calendar grid. If the duplicate task appearance confuses people, promote weeks to plan-level children.

**Advisor as an entity.** `clients.advisor_name` is a denormalized string. It becomes a FK the moment the advisor console needs "show me all my clients," which is Launch 2 scope.

**Connector provenance on KPIs.** `plan_kpis.source` is human-readable text. Once the QuickBooks connector lands, it needs to be a FK to a connector registry so the sync job knows where to fetch and the dashboard can surface staleness per-source.
