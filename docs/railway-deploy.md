# Railway deploy — Milestone B1

Orchestration API (`apps/api`) for business logic, plan generation, and audit writes. Runs separately from the Next.js app on Vercel.

## Current status (2026-06)

| Component | Host | Connected? |
|-----------|------|------------|
| Client + staff web (`apps/web`) | Vercel (`app.*`, `staff.*`) | Yes |
| Staff admin console (prompts, waitlist, clients, staff) | Vercel → Supabase (staff JWT) | Works **without** Railway |
| Orchestration API (`apps/api`) | Railway | Connect repo + set Vercel `ORCHESTRATION_API_URL` (see below) |

Earlier admin pages proxied reads through `ORCHESTRATION_API_URL`. As of commit `8d44b29`, admin **reads and writes** use Supabase directly from the Next.js server. Railway is still needed for future orchestration (plan generation, LLM calls, vault broker) and for the admin **health check** row that probes `GET /health`.

## Quick start (≈10 minutes)

### A. Railway — deploy the API

1. Log in at [railway.com](https://railway.com) → **New Project** → **Deploy from GitHub repo** → `michael-sattler/corduroy-app`
2. If Railway creates multiple services, **delete** any Next.js/web service — only the API belongs here.
3. Open the remaining service → **Settings**:
   - **Source:** `main` branch
   - Build should pick up root [`railway.toml`](../railway.toml) → `apps/api/Dockerfile`
   - If not: set **Dockerfile path** to `apps/api/Dockerfile`, **Root Directory** `/`
4. **Variables** tab — add:

   | Name | Value |
   |------|--------|
   | `SUPABASE_URL` | `https://iggvqbqqzujixshiffqe.supabase.co` |
   | `SUPABASE_ANON_KEY` | Same publishable key as Vercel `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
   | `CORS_ORIGINS` | `https://app.corduroytech.ai,https://staff.corduroytech.ai` |
   | `AWS_REGION` | `us-east-1` |
   | `AWS_ACCESS_KEY_ID` | IAM user `corduroy-dev-railway-invoke` (invoke-only) |
   | `AWS_SECRET_ACCESS_KEY` | Matching secret for that user |
   | `ACCESS_BROKER_LAMBDA_NAME` | `corduroy-dev-access-broker` (from `terraform output access_broker_function_name`) |

5. **Settings → Networking** → **Generate domain** (e.g. `corduroy-api-production.up.railway.app`)
6. Wait for deploy **Success**, then verify:

   ```bash
   curl https://<your-railway-domain>/health
   ```

   Expected: `{"status":"ok","service":"corduroy-api",...}`

### B. Vercel — wire the health check

The admin overview on [staff.corduroytech.ai/admin](https://staff.corduroytech.ai/admin) probes whatever URL is in `ORCHESTRATION_API_URL`. Without it, Vercel defaults to `127.0.0.1:4000` (unreachable) and the card shows **down**.

1. Vercel → your project → **Settings → Environment Variables**
2. Add for **Production** (and Preview if desired):

   | Name | Value |
   |------|--------|
   | `ORCHESTRATION_API_URL` | `https://<your-railway-domain>` — **no trailing slash** |

3. **Deployments** → **Redeploy** production (env changes require redeploy)
4. Open [staff.corduroytech.ai/admin](https://staff.corduroytech.ai/admin) → **Run checks** → Orchestration API should be **healthy**

## 1. Create the Railway service (detail)

1. Log in at [railway.com](https://railway.com)
2. **New Project → Deploy from GitHub repo** → `michael-sattler/corduroy-app`
3. If Railway offers to deploy the whole monorepo, **remove** any auto-created web service — only the API belongs on Railway.
4. Add (or configure) one service:
   - **Source:** GitHub `main` branch
   - **Config:** repo-root `railway.toml` (points at `apps/api/Dockerfile`)
   - Or manually: **Root Directory** `/`, **Dockerfile path** `apps/api/Dockerfile`
   - **Service name:** `corduroy-api`
5. **Generate domain** (Settings → Networking) — note the public URL, e.g. `https://corduroy-api-production.up.railway.app`
6. **Wire Vercel** (required for admin health check — see [Quick start B](#b-vercel--wire-the-health-check) above):
   - Vercel → **Environment Variables** → `ORCHESTRATION_API_URL` = Railway public URL (no trailing slash)
   - Redeploy Vercel production

## 2. Environment variables

Set in **Railway → corduroy-api → Variables**:

| Name | Value |
|------|--------|
| `SUPABASE_URL` | `https://iggvqbqqzujixshiffqe.supabase.co` |
| `SUPABASE_ANON_KEY` | Publishable key from [Supabase API settings](https://supabase.com/dashboard/project/iggvqbqqzujixshiffqe/settings/api) |
| `CORS_ORIGINS` | `https://app.corduroytech.ai,https://staff.corduroytech.ai` |
| `AWS_REGION` | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | `corduroy-dev-railway-invoke` access key |
| `AWS_SECRET_ACCESS_KEY` | Matching secret |
| `ACCESS_BROKER_LAMBDA_NAME` | `corduroy-dev-access-broker` |

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to Railway — AccessBroker uses its own key via Lambda env (Terraform).

## 3. Health check

Railway **Settings → Health Check**:

- **Path:** `/health`
- **Timeout:** 30s

Success response:

```json
{
  "status": "ok",
  "service": "corduroy-api",
  "version": "0.1.0",
  "timestamp": "..."
}
```

## 4. Verify deploy

```bash
curl https://<your-railway-domain>/health
```

### Authenticated routes (require Supabase access token)

| Route | Role | Purpose |
|-------|------|---------|
| `GET /client/me` | client | Returns `user_id`, `client_id` |
| `GET /client/dashboard` | client | Shell placeholder |
| `GET /staff/me` | staff | Returns `user_id`, `staff_role` |
| `GET /staff/dashboard` | staff | Shell placeholder |

Pass the user's JWT from Supabase Auth:

```bash
curl -H "Authorization: Bearer <access_token>" https://<api>/client/me
```

Wrong role → `403`. Missing/invalid token → `401`.

## 4b. Verify Vault / AccessBroker (Phase 1.2)

After Railway has the AWS + `ACCESS_BROKER_LAMBDA_NAME` vars and Vercel has `ORCHESTRATION_API_URL`:

1. **Staff console** ([staff.corduroytech.ai/dashboard](https://staff.corduroytech.ai/dashboard)) — header pill should be **green** (DryRun invoke permitted).
2. **Admin health** ([staff.corduroytech.ai/admin](https://staff.corduroytech.ai/admin)) → **Run checks** — “AccessBroker Lambda” row should be **healthy**.
3. **End-to-end presign** (from your machine, against production API):

   ```powershell
   $env:API_URL = "https://<your-railway-domain>"
   npm run test:vault-presign
   ```

   Uses Supabase sign-in locally but calls the Railway API for presign. Expect `Presign OK` with `url`, `s3_key`, `audit_event_id`.

## 5. Local development

**Use one API at a time on port 4000** — either `npm run dev:api` **or** `docker compose up api`, not both. Mixing them causes `EADDRINUSE` and a stale API without Vault env vars (orange telltale). See [apps/api/docs/lambda-ops.md](../apps/api/docs/lambda-ops.md).

```bash
# From repo root — uses apps/web/.env for Supabase keys
cp apps/api/.env.example apps/api/.env   # optional overrides

npm install
npm run dev:api
```

Health: http://localhost:4000/health

With Docker:

```bash
docker compose up api --build
```

## 6. Staging vs production

For Milestone B, a **single Railway service** on `main` is enough. Add a second environment (staging) when you need isolated API keys or pre-production testing — duplicate the service in Railway with a separate branch or environment.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Admin health shows API **down** on Vercel | Set `ORCHESTRATION_API_URL` to Railway public URL; redeploy Vercel |
| Admin health shows API **degraded** (“not set”) | Same — env var missing or still points at localhost |
| `curl` to Railway `/health` fails | Railway deploy not healthy — check build logs and env vars |
| Build fails on `npm ci` | Ensure Dockerfile copies root `package-lock.json` |
| `Missing required env var` | Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Railway |
| CORS errors from browser | Add the exact frontend origin to `CORS_ORIGINS` |
| AccessBroker telltale **orange** on production | Set `ACCESS_BROKER_LAMBDA_NAME` + AWS vars on **Railway**; redeploy API |
| AccessBroker telltale **red** | Check IAM invoke policy, function name, region; read tooltip `detail` |
| Local telltale orange after editing `.env` | Stop Docker **or** stop `dev:api` — only one process on :4000 |
| `403 Wrong surface` | Client token on `/staff/*` or vice versa — by design |
