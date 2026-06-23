# Corduroy Platform — Build Plan & To-Do

**Immediate goal:** `app.corduroytech.ai` lets a client log in to a placeholder dashboard; `staff.corduroytech.ai` lets a staff member log in to a placeholder staff dashboard.

**Reference:** [TDD Platform](./tdd-platform.md) §12 (Phase 0–2), [Scope & Timeline](./scope-build-timeline.md). Account credentials in [creds-platform.md](./creds-platform.md).

> **Naming note:** TDD uses `admin.corduroy.com`; production domains are `app.corduroytech.ai` (client) and `staff.corduroytech.ai` (staff/admin console). Same one-codebase / two-subdomain pattern.

---

## Definition of done — Milestone A (this sprint)

- [ ] `app.corduroytech.ai` resolves and serves the client app over HTTPS
- [ ] `staff.corduroytech.ai` resolves and serves the staff console over HTTPS
- [ ] A client user can sign in (email/password) and lands on a placeholder client dashboard showing their name and client org
- [ ] A staff user can sign in and lands on a placeholder staff dashboard (distinct layout/copy from client)
- [ ] Client JWT cannot access staff routes; staff JWT cannot access client-only routes (subdomain + middleware gate)
- [ ] At least one seeded test client user and one seeded test staff user exist in Supabase

---

## Milestone A — Auth shells on live domains

### A1. Repository & app scaffold

- [DONE] **Git repo:** `git init` in `corduroy`, add `.gitignore` (node_modules, `.env*`, `.next`, etc.), initial commit with `docs/`
- [DONE] **Remote:** create GitHub repo `corduroy` (org: Corduroy), push `main`, enable branch protection on `main` when ready
- [DONE] **Docker:** `Dockerfile` for the Next.js web app (multi-stage: deps → build → production runner)
- [DONE] **Docker Compose:** `docker-compose.yml` for local dev — web service on port 3000, env via `.env.local`; optional `docker-compose.override.yml` for subdomain host mapping notes
- [DONE] `.dockerignore` aligned with `.gitignore`
- [DONE] Document `docker compose up` and `npm run dev` paths in README (both should work for local dev)
- [DONE] Initialize monorepo: Next.js (App Router), TypeScript, Bootstrap, shared `components/` and `lib/`
- [DONE] Subdomain-aware routing via Next.js middleware:
  - `app.*` → client surface (`/dashboard`, `/login`, …)
  - `staff.*` → staff surface (`/dashboard`, `/login`, …)
- [DONE] Local dev: document how to simulate subdomains (`app.localhost`, `staff.localhost` or hosts file)
- [DONE] Placeholder pages only — no Vault/Planner UI yet:
  - Client dashboard: welcome, client name, "Vault and 90-Day Plan coming soon"
  - Staff dashboard: welcome, staff name/role, "Client list and review queue coming soon"

### A2. Supabase (identity)

- [ ] Create/link Supabase project `corduroy-app` (see creds-platform.md)
- [ ] Enable Supabase Auth (email/password for v1; magic link optional)
- [ ] Define roles in `app_metadata` or a `profiles` table: `client` | `staff` (staff sub-roles `principal` | `advisor` | `admin` can wait)
- [ ] Staff sign-in path:
  - **v1 pragmatic:** email/password restricted to `@corduroytech.ai` domain + manual staff row approval
  - **v1 target (TDD §4.2):** SAML SSO + mandatory MFA via email-domain routing — confirm Supabase Pro SAML tier, then swap login UI
- [ ] Seed data: 1 `clients` row, 1 `client_users` mapping, 1 `staff` row, 1 `staff_assignments` row

### A3. Core schema (minimal for auth)

Run as version-controlled SQL migrations in `supabase/migrations/`:

- [ ] `clients` — id, name, created_at
- [ ] `client_users` — user_id (auth.users), client_id, display_name
- [ ] `staff` — user_id, role, approved (boolean gate for new staff)
- [ ] `staff_assignments` — staff_id, client_id (needed before staff can "select a client" later)
- [ ] Enable RLS on all tables; policies:
  - Client users: read own `client_users` row and own `clients` row only
  - Staff: read assigned clients via `staff_assignments` (broader staff policies come with Vault)
- [ ] Defer for now: `audit_events`, `vault_objects`, `plans`, `milestones`, `tasks`

### A4. Auth integration in Next.js

- [ ] `@supabase/ssr` — server and browser clients, cookie-based sessions
- [ ] `/login` on each subdomain (shared component, different branding/copy)
- [ ] Post-login redirect to `/dashboard`; unauthenticated users redirected to `/login`
- [ ] Middleware: read JWT, check `role` claim, reject wrong surface (client token on `staff.*` → sign out or 403)
- [ ] Logout flow

### A5. Vercel & DNS

- [ ] Connect repo to Vercel project (see creds-platform.md)
- [ ] Configure custom domains:
  - `app.corduroytech.ai` → production
  - `staff.corduroytech.ai` → production (same Vercel project)
- [ ] Environment variables in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Staging/preview: optional `app.staging.corduroytech.ai` / `staff.staging.corduroytech.ai` or Vercel preview URLs for PRs

### A6. Smoke test & handoff

- [ ] Document "how to log in as client / staff" in a short README (no secrets in repo)
- [ ] Verify session persists across refresh; verify cross-subdomain isolation
- [ ] Security sanity: anon key only in frontend; no service role key in client bundle

---

## Milestone B — Platform scaffolding (TDD Phase 0 remainder)

Complete after Milestone A is live. Unblocks Vault and Planner work.

### B1. Orchestration API shell (Railway)

- [ ] Node/Express or Fastify API service in `apps/api/` (or `services/api/`)
- [ ] Dockerfile + Railway service `corduroy-app` with staging/production envs
- [ ] Health check `GET /health`
- [ ] JWT validation middleware (same Supabase JWT; separate route groups `/client/*` and `/staff/*`)
- [ ] CORS locked to `app.corduroytech.ai` and `staff.corduroytech.ai`

### B2. CI/CD

- [ ] GitHub Actions: lint + typecheck on PR
- [ ] Supabase migrations applied via CI or documented CLI workflow
- [ ] Railway deploy on merge to `main` (staging) / tag (production) — pick one branching model and document it

### B3. AWS account skeleton (no Vault yet)

- [ ] Dedicated VPC, S3 and KMS VPC endpoints (TDD §5.1)
- [ ] IAM role stub for future Lambda execution role
- [ ] Terraform or CDK layout in `infra/` — empty modules for buckets/Lambdas

### B4. Remaining Phase 0 schema

- [ ] `audit_events` — append-only
- [ ] `vault_objects` — catalog table (empty until Phase 1)

---

## Phase 1 — The Vault (TDD §12 items 5–11)

- [ ] IaC: per-client S3 bucket + KMS key provisioning
- [ ] AccessBroker Lambda: pre-signed GET/PUT URLs, server-built keys, audit append
- [ ] Upload flow: API → broker → browser PUT → S3 ObjectCreated trigger
- [ ] ContentDispatcher Lambda: extract, derived writes, catalog upsert
- [ ] Catalog reconciliation job
- [ ] Data Hub UI (add-source + repository views)
- [ ] Security checkpoint: cross-client access review, canary, break-glass runbook

---

## Phase 2 — 90-Day Planner (TDD §12 items 12–16)

- [ ] Generation pipeline (Audit + Vault context → structured plan JSON)
- [ ] Plan schema in Postgres (`plans`, `milestones`, `tasks`, `plan_edits`)
- [ ] Advisor review queue + edit-rate tracking
- [ ] Client plan view (read, mark complete, comment)
- [ ] End-to-end test with Elevated Concrete Solutions

---

## Deferred (Launch 2 per TDD §11)

- KPI Dashboard (`dashboard_widgets`)
- Daily Coaching + HITL escalation queue
- QuickBooks / connector integrations
- Desktop agentic retrieval

---

## Suggested build order (this week)

| Day | Focus |
|-----|--------|
| 1 | A1 git repo + Docker + Next.js scaffold, subdomain middleware, placeholder UIs |
| 2 | A2–A3 Supabase project, migrations, seed users |
| 3 | A4 auth wiring end-to-end locally |
| 4 | A5 Vercel deploy + DNS for both subdomains |
| 5 | A6 smoke tests; start B1 API shell if time |

---

## Open decisions (resolve before or during A2)

| Question | Recommendation for first pass |
|----------|-------------------------------|
| Staff SSO now or later? | Email/password + `@corduroytech.ai` gate + `staff.approved` flag now; SAML SSO before real client data |
| Staging Supabase separate project? | One project with staging branch/preview is fine initially; split before production client data |
| `staff` vs `admin` subdomain | Use `staff.corduroytech.ai` as planned; maps to TDD "Admin Console" |
