# Corduroy Platform — Build Plan & To-Do

**Immediate goal:** `app.corduroytech.ai` lets a client log in to a placeholder dashboard; `staff.corduroytech.ai` lets a staff member log in to a placeholder staff dashboard.

**Reference:** [TDD Platform](./tdd-platform.md) §12 (Phase 0–2), [Scope & Timeline](./scope-build-timeline.md). Account credentials in [creds-platform.md](./creds-platform.md).

> **Naming note:** TDD uses `admin.corduroy.com`; production domains are `app.corduroytech.ai` (client) and `staff.corduroytech.ai` (staff/admin console). Same one-codebase / two-subdomain pattern.

---

## Definition of done — Milestone A (this sprint)

- [DONE] `app.corduroytech.ai` resolves and serves the client app over HTTPS
- [DONE] `staff.corduroytech.ai` resolves and serves the staff console over HTTPS
- [DONE] A client user can sign in (email/password) and lands on a placeholder client dashboard showing their name and client org
- [DONE] A staff user can sign in and lands on a placeholder staff dashboard (distinct layout/copy from client)
- [DONE] Client JWT cannot access staff routes; staff JWT cannot access client-only routes (subdomain + middleware gate)
- [DONE] At least one seeded test client user and one seeded test staff user exist in Supabase

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

- [DONE] Create/link Supabase project `corduroy-app` — ref `iggvqbqqzujixshiffqe` (see [supabase-setup.md](./supabase-setup.md); run `npx supabase login` + `npx supabase link` locally)
- [ ] Enable Supabase Auth (email/password for v1; magic link optional) — **Dashboard step** (documented in supabase-setup.md)
- [DONE] Define roles in `app_metadata`: `client` | `staff` (`staff_role` for sub-roles)
- [DONE] Staff sign-in path (v1 pragmatic): `@corduroytech.ai` + `staff.approved` — enforced in A4 login UI
- [DONE] Seed script: `npm run db:seed` → All-American Fitness, client user, staff user, assignment

### A3. Core schema (minimal for auth)

Run as version-controlled SQL migrations in `supabase/migrations/`:

- [DONE] `clients` — id, name, created_at
- [DONE] `client_users` — user_id (auth.users), client_id, display_name
- [DONE] `staff` — user_id, role, approved (boolean gate for new staff)
- [DONE] `staff_assignments` — staff_id, client_id (needed before staff can "select a client" later)
- [DONE] Enable RLS on all tables; policies:
  - Client users: read own `client_users` row and own `clients` row only
  - Staff: read assigned clients via `staff_assignments` (broader staff policies come with Vault)
- [ ] Apply migration to remote: `npm run db:push` (after `supabase link`)
- [DONE] Defer for now: `audit_events`, `vault_objects`, `plans`, `milestones`, `tasks`

### A4. Auth integration in Next.js

- [DONE] `@supabase/ssr` — server and browser clients, cookie-based sessions
- [DONE] `/login` on each subdomain (shared component, different branding/copy)
- [DONE] Post-login redirect to `/dashboard`; unauthenticated users redirected to `/login`
- [DONE] Middleware: read JWT, check `role` claim, reject wrong surface (client token on `staff.*` → sign out or 403)
- [DONE] Logout flow

### A4-supplemental
- [x] build out static html for client /vault
- [x] build out static html for client /plan
- [x] build out static mockup for staff /dashboard
- [x] build out navigation and styling
- [x] componentize elements: layout-staff, layout-client, top nav, pagehead, logged-in-user widget
- [x] placeholder management forms for important entities: 
  - [x] Staff: manage/create client account .., name, location, datecreated, logo upload. Link from client panel in left of dashboard. Add a button at the bottom of the list to add a new client. 
  - [x] Staff: manage/create client users ... list view + detail view ... name, email, password changes, avatar upload. Display list view on client account managment panel, ability to edit inline and create a new account user
  - [x] Clients: manage user ... name, email, password change request, avatar upload ... upper right corner of navtop should contain avatar image and user's name, pulldown to expose links to utility options: account, preferences, sign out

- [x] placeholder tools for staff admin
  - [x] admin dashboard
       - [x] counts of back-end client and staff actions like logins/uploads/file accesses/task checkoffs, etc.
       - [x] health check - view of API health, S3 connectivity
    - [x] link to prompt library tool - we'll put the content of the various prompts we use in a db table for easy tuning by staff
    - [x] link to wait list view ... list+detail ... view of folks who have signed up from the mainsite for a consultation
  

### A5. Vercel & DNS

See [vercel-deploy.md](./vercel-deploy.md) for step-by-step instructions.

- [DONE] Connect repo to Vercel project (`corduroy-app` on `michael-sattler` account)
- [DONE] Configure custom domains:
  - `app.corduroytech.ai` → production
  - `staff.corduroytech.ai` → production (same Vercel project)
- [DONE] Environment variables in Vercel: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [DEFERRED] Staging/preview: `app.staging.corduroytech.ai` / `staff.staging.corduroytech.ai` — use `*.vercel.app` path prefixes (`/app`, `/staff`) until staging DNS is needed

### A6. Smoke test & handoff

- [DONE] Document "how to log in as client / staff" in a short README (no secrets in repo)
- [DONE] Verify session persists across refresh; verify cross-subdomain isolation
- [DONE] Security sanity: anon key only in frontend; no service role key in client bundle

---

## Milestone B — Platform scaffolding (TDD Phase 0 remainder)

Complete after Milestone A is live. Unblocks Vault and Planner work.

### B1. Orchestration API shell (Railway)

See [railway-deploy.md](./railway-deploy.md).

- [DONE] Node/Fastify API service in `apps/api/`
- [DONE] Dockerfile + docker-compose service (Railway deploy: dashboard step)
- [DONE] Health check `GET /health`
- [DONE] JWT validation middleware (Supabase JWT; route groups `/client/*` and `/staff/*`)
- [DONE] CORS locked to `app.corduroytech.ai` and `staff.corduroytech.ai` (+ local dev origins)

### B1 Supplemental. Non-Vault API interactions
- [PARTIAL] staff admin CRUD (Vercel → Supabase; Railway not required for current admin UI)
  - [DONE] healthchecks: Supabase live; API/S3/Lambda rows (API down until Railway connected)
  - [DONE] prompt library — list + edit (Supabase via staff JWT)
  - [DONE] wait list — list, detail, status/notes (Supabase via staff JWT)
  - [DONE] client user management — create portal users (`/admin/clients/[id]`; needs `SUPABASE_SERVICE_ROLE_KEY` on Vercel)
  - [DONE] client organization/account management — create orgs (`/admin/clients`)
  - [DONE] staff user management — create staff (`/admin/staff`)
  - [DONE] staff “View as client” impersonation (needs service role key on Vercel)
  - [DONE] image upload (organization logos, user and admin avatars; `public/uploads/`, cache-busted preview)

### B2. CI/CD / Continuous Integration and Continuous Delivery

- [DONE] GitHub Actions: lint + typecheck on PR
- [ ] Supabase migrations applied via CI or documented CLI workflow
- [ ] Railway: connect GitHub repo + deploy `apps/api` per [railway-deploy.md](./railway-deploy.md) (`railway.toml` at repo root)

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
- [ ] vault UI (add-source + repository views)
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
