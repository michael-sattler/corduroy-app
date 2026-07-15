# Corduroy KPIs — Dashboard Widgets Build Plan

**Goal:** Close the gap between the metric schema and what dashboards actually render. Staff assign presentation tiles (`dashboard_widgets`) per client; client and staff dashboards render those tiles through a kind→renderer registry.

**Reference:** [Schema guide](./corduroy_schema_guide_v2.md) (metric layer + `dashboard_widgets`), [TDD Platform](./tdd-platform.md) §11 (standard presentation / unique metric), [How we track metrics](./docs-howwetrackmetrics.md), [Build Plan](./buildplan.md) (KPI Dashboard partial / “Make widgets visual”).

**Seed client:** All-American Fitness

---

## Naming (do not confuse)

| Term | Role |
|------|------|
| `metric_definitions` | Catalog: what the metric is + **default** `widget_type` / `palette` |
| `client_metrics` | This client tracks that definition (+ cached `current_value`) |
| `dashboard_widgets` | Presentation row: one tile for a client; FK → **`client_metrics`** |
| `plan_kpis` | Plan seam only: baseline / target for the active plan. **Not** the widget assignment table |

Same `client_metric` may appear in multiple `dashboard_widgets` (e.g. `single_stat` + `trend_line`, or different `dimension_filter`s).

---

## Current state

| Piece | State |
|-------|--------|
| Schema: `metric_definitions`, `client_metrics`, `metric_observations`, `dashboard_widgets`, `plan_kpis` | Shipped |
| Allowed kinds enum (`single_stat` \| `trend_line` \| `bar` \| `progress_to_goal` \| `traffic_light`) | DB CHECK + `METRIC_WIDGET_TYPES` in `apps/web/src/lib/metric-catalog-types.ts` |
| Catalog admin can set definition `widget_type` | Shipped; **not used by dashboard render** |
| Dashboards today | Hardcoded featured `plan_kpis` → always single-stat cards (`plan-kpi-widgets.tsx` + staff duplicates) |
| Kind→renderer library | **Missing** |
| Staff assigner for `dashboard_widgets` | **Missing** |
| Loaders reading `dashboard_widgets` | **Missing** |

---

## Definition of done

- [x] Kind registry in app code: each `MetricWidgetType` maps to data needs + a React renderer
- [x] Staff tool: for a selected client, create/edit/hide/reorder `dashboard_widgets` by picking a `client_metric` + a kind from the registry
- [x] Client + staff dashboards load visible widgets (`sort_order`, `is_visible`) from `dashboard_widgets`, not from hardcoded featured KPI ID lists
- [x] Shared render path used by both surfaces
- [x] `progress_to_goal` joins active `plan_kpis` when present; otherwise degrades to `single_stat`
- [x] AAF has `dashboard_widgets` assigned end-to-end (via staff assigner; SQL seed optional for new clients)
- [x] Non–`single_stat` kinds may start as stubs, but `single_stat` is production-ready through the new path

---

## Architecture

```
metric_definitions          (default widget_type / palette)
        │
        ▼
client_metrics              (per-client metric instance)
        │
        ├──────────────────► metric_observations   (series for charts)
        │
        └──────────────────► dashboard_widgets     (tiles to show)
                                    │
                                    └─ widget_type ──► kind registry ──► renderer
                                              │
                                              └─ progress_to_goal only ──► plan_kpis
```

**Kind library location:** TypeScript registry in the web app (not a Postgres table). Allowed values stay enforced by the existing DB CHECK + `METRIC_WIDGET_TYPES`. Expanding later = migrate CHECK + add registry entry.

---

## Phase K1 — Kind registry + shared renderer

- [x] Add `apps/web/src/lib/widgets/` (or similar):
  - `resolve-kind.ts` — registry keyed by `MetricWidgetType` (`id`, label, `dataNeeds`)
  - React renderers in `apps/web/src/components/widgets/kinds-registry.tsx`
- [x] Extract current single-stat card into the `single_stat` renderer (reuse formatting from `staff-plan-dashboard-format.ts`)
- [x] Stub `trend_line`, `bar`, `progress_to_goal`, `traffic_light` (labeled placeholder is fine)
- [x] Shared shell: `DashboardWidgetGrid` — maps widget DTOs → registry lookup → render
- [x] Unknown / missing kind degrades to `single_stat` via `resolveWidgetKind`
- [x] Client + staff dashboards temporarily adapt plan KPI rows → `DashboardWidgetView` (until K3)

---

## Phase K2 — Staff assigner

- [x] Staff UI in Client KPIs drawer, tab **Dashboard widgets**: one row per `client_metric` with kind pulldown (Not on dashboard ↔ assigned kind), visibility + reorder for assigned
- [x] Create / edit / unassign from each metric row; optional `label_override` / `palette` / `dimension_filter` API-ready (label UI deferred)
- [x] Default `widget_type` / `palette` from the metric’s `metric_definitions` row; staff may override kind on the widget
- [x] API: `/api/staff/dashboard-widgets` GET/POST/PATCH/DELETE — staff access check + service-role writes (table is SELECT-only via RLS)
- [x] Reorder + hide without deleting (`sort_order` / `is_visible`); hard delete also available
- [x] Does **not** require a `plan_kpi` for non-goal kinds

---

## Phase K3 — Dashboard loaders + surfaces

- [x] Shared loader `loadDashboardWidgets`:
  - `dashboard_widgets` ⋈ `client_metrics` ⋈ `metric_definitions`
  - `metric_observations` when kind needs series
  - `plan_kpis` (active plan) for goal chrome; `progress_to_goal` degrades to `single_stat` if unbound
- [x] Client + staff dashboard APIs return `{ plan, widgets }`; featured KPI ID lists removed
- [x] Wire client dashboard (“Key metrics”) through `DashboardWidgetGrid` / `PlanKpiWidgets`
- [x] Wire staff plan/dashboard tabs through the same grid (observe via widget → KPI adapter)
- [x] Carry `current_value_observed_on` / `last_observed_at` on the widget DTO
- [x] Fallback: empty state + staff CTA to **Edit KPIs → Dashboard widgets**

---

## Phase K4 — Seed + verify (AAF)

- [x] AAF widgets assigned via staff **Dashboard widgets** tab (durable SQL seed for auto-provision on new clients deferred)
- [x] Assign / change / unassign path verified in the assigner
- [x] Dashboards load assigned widgets (`single_stat` live; other kinds stub until K5)
- [ ] Optional later: migration seed + dual-tile on one metric; no-active-plan smoke check

---

## Phase K5 — Visual kinds (after K1–K4)

- [x] `progress_to_goal` — progress bar / % vs plan target; degrades to `single_stat` if unbound
- [x] `trend_line` — SVG sparkline from `metric_observations` (+ dimension filter in loader)
- [x] `bar` — SVG bars for recent observation periods
- [x] `traffic_light` — red / yellow / green from progress (&lt;40 / &lt;70) or current÷target; unknown if no signal
- [x] `donut` — progress ring toward plan target (migration `20260715120000_widget_type_donut.sql`); degrades to `single_stat` if unbound
- [x] Registry wired; no new chart library (pure SVG/CSS)
- [x] Staff observe: `+` on Key metrics tiles (Dashboard + Plan tabs) → observation drawer → `metric_observations`
- [x] Plan KPIs editor: staff can set `baseline_snapshot` / `baseline_established`, `target_value`, target text, review cadence (incl. “Use current” as baseline)

---

## Suggested build order

| Step | Focus | Outcome |
|------|--------|---------|
| 1 | K1 registry + `single_stat` | One code path for kinds; no schema change |
| 2 | K2 staff assigner | Per-client tiles are data, not hardcoded IDs |
| 3 | K3 loaders + both dashboards | UI reads `dashboard_widgets` |
| 4 | K4 AAF seed | End-to-end proof |
| 5 | K5 charts / traffic light | “Make widgets visual” |

---

## Out of scope (this plan)

- Connector sync / QuickBooks (source_binding stays human-readable)
- LLM widget JSON generation (TDD Launch 2 note); registry still matches that contract
- New metric catalog provisioning beyond existing core/swap seed
- Benchmarking UI across clients

---

## Open decisions (resolve during K2/K3 if needed)

1. **Auto-provision widgets** on client create vs empty until staff assigns — recommend: seed core defaults on provision, staff curates visibility.
2. **Staff affordances** — resolved: `renderActions` on `DashboardWidgetGrid` for observe; Edit KPIs drawer for assignment.
3. **`palette`**: keep token string for now; visual kinds use fixed CSS tones.
