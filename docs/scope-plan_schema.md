# Corduroy 90-Day Plan — JSON Schema Guide

**Version:** 1.0
**Date:** 2026-06-24
**Author:** Corduroy Technologies

---

## Purpose

This document describes the structure, intended use, and business logic assumptions behind the Corduroy 90-Day Plan JSON schema (`corduroy_plan_schema_template.json`). It is intended for developers building against the schema, advisors configuring plans, and LLM prompt engineers designing generation and update workflows.

---

## How the Plan JSON Is Used

### Generation — Once

The plan JSON is generated **once**, at the start of a client engagement, by presenting an LLM with the client's completed Audit document and this schema template as a structural guide. The LLM produces a fully populated JSON object with all elements initialized. This is the only time the full plan is generated from scratch.

The JSON template should be included in the generation prompt with the following instruction framing:

> *"Using the attached audit document and the schema below as your structural guide, generate a complete 90-day execution plan for this client. Populate all fields. Use the example values in the template as format references only — replace all content with client-specific data. Do not leave placeholder text."*

### Updates — Ongoing

After initial generation, **individual elements are updated in isolation**. The full plan is never regenerated. Updates are surgical writes to specific nodes — a task status changes, a KPI reading arrives, a milestone is marked achieved, a risk is re-assessed. Each update appends an entry to that element's `history[]` array and updates the corresponding `current_*` field and `last_updated` timestamp.

---

## Schema Structure

The plan JSON contains the following top-level objects, listed in dependency order:

| Object | Purpose |
|---|---|
| `plan` | Metadata wrapper: client, advisor, dates, status |
| `participants` | Registry of people referenced in the plan |
| `clients` | Registry of the client's customers/members referenced in the plan |
| `phases` | Time buckets (Month 1, 2, 3) that tasks and milestones belong to |
| `goals` | High-level outcomes the plan is designed to achieve |
| `milestones` | Discrete, dateable events that prove a goal is progressing |
| `tasks` | Specific assigned actions that drive milestones forward |
| `kpis` | Measurable indicators tracked throughout the engagement |
| `risks` | Named threats to plan execution with severity and mitigation |

---

## The Initial / Current Value Pattern

Every stateful element in the schema carries two versions of its key fields:

- **`initial_*`** — set at plan generation, **never overwritten**. This is the frozen baseline.
- **`current_*`** — updated as the plan evolves over time.

At generation time, `initial_*` and `current_*` are identical. Over the 90-day period they diverge, and the delta between them is the primary signal for progress reporting, coaching briefings, and the end-of-cycle Milestone Summary document.

### Fields by element type

| Element | Initial fields | Current fields |
|---|---|---|
| `goals` | `initial_status` | `current_status` |
| `milestones` | `initial_status`, `initial_pct_complete` | `current_status`, `current_pct_complete` |
| `tasks` | `initial_status`, `initial_pct_complete` | `current_status`, `current_pct_complete` |
| `kpis` | `initial_value` | `current_value` |
| `risks` | `initial_severity`, `initial_likelihood` | `current_severity`, `current_likelihood` |

> **Enforcement note:** `initial_*` fields must be treated as write-once at the application layer. No update pathway — human, agent, or automated — should be permitted to overwrite them after plan generation.

---

## History Arrays

Every stateful element carries a `history[]` array. Each entry records:

| Field | Description |
|---|---|
| `timestamp` | ISO 8601 datetime of the change |
| `changed_by` | `participant.id` of the person or system that made the change |
| `change_source` | Enumerated source of the change (see below) |
| `fields_changed` | Key/value map of what changed (for goals, milestones, tasks, risks) |
| `value` | New value (KPIs only — numeric time series) |
| `note` | Optional free-text annotation explaining the change |

### `change_source` enum

| Value | When used |
|---|---|
| `plan_generation` | The initial write at plan creation — all first history entries |
| `advisor_edit` | A Corduroy advisor manually updates an element via the admin console |
| `client_update` | The client logs progress directly (task check-ins, milestone confirmations) |
| `kpi_connector` | An automated connector (QuickBooks, member management system) pushes a new KPI reading |
| `coaching_checkin` | The daily coaching layer updates task or milestone progress based on a client interaction |
| `system_reconciliation` | A scheduled job corrects a discrepancy (e.g., Vault reconciliation pass) |

The `change_source` field makes the history array filterable — the 90-day review can show only advisor edits, or only connector-driven KPI updates, without walking the full log.

---

## Cross-Reference Conventions

All relationships between elements are expressed as **ID references**, never as nested objects. This keeps the JSON flat, makes LLM generation more reliable, and allows individual elements to be updated without touching parent objects.

| Reference | How it works |
|---|---|
| Tasks → Milestones | `task.milestone_ids[]` contains one or more `milestone.id` values |
| Milestones → Goals | `milestone.goal_ids[]` contains one or more `goal.id` values |
| KPIs → Goals | `kpi.goal_ids[]` contains one or more `goal.id` values |
| Goals → Milestones | `goal.milestone_ids[]` is a convenience reverse index — not authoritative |
| Risks → Owner | `risk.owner_id` references a single `participant.id` |
| Any element → Clients | `client_ids[]` references one or more `clients.plan_client_id` values |

---

## The Clients Registry

The `clients[]` array is a **lightweight reference registry**, not a record of truth. It exists so that tasks, milestones, KPIs, and risks can be linked to specific customers or members by name within the plan.

Each entry carries two IDs:

- **`plan_client_id`** — the internal identifier used for cross-references within this plan JSON.
- **`external_client_id`** — the foreign key to the authoritative customer record in the Corduroy database.

All other customer data (contact information, history, revenue, status) lives in the database and is resolved at runtime by joining on `external_client_id`. The plan JSON does not duplicate or own that data.

---

## The Participants Registry

The `participants[]` array follows the same pattern. Each participant carries:

- **`id`** — used for cross-references within the plan (`assignee_id`, `owner_id`, `changed_by`).
- **`external_user_id`** — the foreign key to the Supabase `users` table.

Participant types are either `client` (the business owner and their team) or `corduroy` (advisors and apprentices).

---

## KPI Business Logic

### No baseline_value — use initial_value

The schema uses `initial_value` rather than `baseline_value` for consistency with the broader `initial_* / current_*` pattern. They mean the same thing: the value at plan generation, frozen as the comparison point for all future deltas.

### target_value is plan-level, not element-level

`target_value` represents the 90-day goal for that KPI — where the client should be at day 90. It is set at generation and should not change unless the plan is formally revised by an advisor. It is not updated by incoming KPI readings.

### KPI history is a time series

Unlike other elements where `history[]` tracks field changes, KPI history entries each carry a `value` field representing the reading at that point in time. This makes `kpi.history[]` a lightweight time series that can be used to plot trend lines on the dashboard without requiring a separate readings table — at least through Launch 1.

### Late-arriving data

When two KPI updates arrive close together from different sources (e.g., a manual upload and an automated connector both update MRR in the same day), the application should apply a `source_priority` rule to determine which `current_value` wins. Recommended priority order, highest to lowest: `advisor_edit` > `kpi_connector` > `client_update` > `coaching_checkin`. Both readings should still be appended to `history[]` regardless of which wins.

---

## ID Conventions

IDs are human-readable and prefixed by element type. They must be stable after generation — they are used as foreign keys across the system and must never be regenerated or reshuffled.

| Prefix | Element |
|---|---|
| `plan_` | Plan metadata |
| `part_` | Participants |
| `pcl_` | Plan-level client references |
| `phase_` | Phases |
| `goal_` | Goals |
| `ms_` | Milestones |
| `task_` | Tasks |
| `kpi_` | KPIs |
| `risk_` | Risks |

When instructing the LLM to generate a plan, include explicit direction to use this prefix convention and to produce sequential numeric suffixes (`task_001`, `task_002`, etc.) rather than UUIDs. Human-readable IDs are easier to reference in advisor edits, prompt context, and debug logs.

---

## Enumerated Field Values

The following fields accept only the values listed. The LLM generation prompt should include these enums explicitly to prevent freeform output.

| Field | Allowed values |
|---|---|
| `plan.status` | `draft`, `active`, `complete` |
| `goal.current_status` | `active`, `achieved`, `deferred` |
| `milestone.current_status` | `pending`, `in_progress`, `achieved`, `at_risk`, `missed` |
| `task.current_status` | `open`, `in_progress`, `done`, `deferred` |
| `task.class` | `action`, `deliverable`, `meeting`, `review` |
| `risk.current_severity` | `low`, `medium`, `high` |
| `risk.current_likelihood` | `low`, `medium`, `high` |
| `kpi.frequency` | `daily`, `weekly`, `monthly` |
| `participant.type` | `client`, `corduroy` |
| `client.type` | `member`, `corporate_account`, `prospect` |
| `history.change_source` | `plan_generation`, `advisor_edit`, `client_update`, `kpi_connector`, `coaching_checkin`, `system_reconciliation` |

---

## What the LLM Should and Should Not Generate

### The LLM should generate:
- All content fields: names, descriptions, notes, mitigation text
- All date fields based on the plan `period_start` and phase structure
- All cross-reference ID arrays, using the IDs it assigns
- Initial and current values (identical at generation time)
- The first `history[]` entry for every element, with `change_source: "plan_generation"`

### The LLM should not generate:
- `external_user_id` or `external_client_id` values — these are resolved by the application after generation
- UUIDs for any ID field — use the prefixed sequential convention
- Any `history[]` entries beyond the initial generation entry
- `current_*` values that differ from `initial_*` values — at generation they must be identical

---

## Relationship to the Vault

The plan JSON is stored in the client's Vault under a versioned path, e.g.:

```
/clients/{client_id}/plans/plan_aaf_001_v1.0.json
```

The Postgres `vault_objects` catalog table indexes it like any other Vault object. Individual element updates may be written back to this file, or — preferred for Launch 2 and beyond — parsed into dedicated Postgres rows at ingest time, with the JSON serving as the generation and export format and Postgres serving as the live source of truth for queryable elements.

---

*End of document*
