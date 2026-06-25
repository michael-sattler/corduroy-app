# Railway deploy — Milestone B1

Orchestration API (`apps/api`) for business logic, plan generation, and audit writes. Runs separately from the Next.js app on Vercel.

## Current status (2026-06)

| Component | Host | Connected? |
|-----------|------|------------|
| Client + staff web (`apps/web`) | Vercel (`app.*`, `staff.*`) | Yes |
| Staff admin console (prompts, waitlist, clients, staff) | Vercel → Supabase (staff JWT) | Works **without** Railway |
| Orchestration API (`apps/api`) | Railway | **Not connected yet** |

Earlier admin pages proxied reads through `ORCHESTRATION_API_URL`. That broke production when Railway was not deployed. As of commit `8d44b29`, admin **reads and writes** use Supabase directly from the Next.js server (same RLS as the API routes). Railway is still needed for future orchestration (plan generation, LLM calls, vault broker) and for the admin **health check** row that probes `GET /health`.

## 1. Create the Railway service

1. Log in at [railway.com](https://railway.com)
2. **New Project → Deploy from GitHub repo** → `michael-sattler/corduroy-app`
3. If Railway offers to deploy the whole monorepo, **remove** any auto-created web service — only the API belongs on Railway.
4. Add (or configure) one service:
   - **Source:** GitHub `main` branch
   - **Config:** repo-root `railway.toml` (points at `apps/api/Dockerfile`)
   - Or manually: **Root Directory** `/`, **Dockerfile path** `apps/api/Dockerfile`
   - **Service name:** `corduroy-api`
5. **Generate domain** (Settings → Networking) — note the public URL, e.g. `https://corduroy-api-production.up.railway.app`
6. Optional — wire Vercel to the API for health monitoring only:
   - Vercel → **Environment Variables** → `ORCHESTRATION_API_URL` = Railway public URL (no trailing slash)
   - Redeploy Vercel. Admin pages do not require this; the admin overview health card will show API status.

## 2. Environment variables

Set in **Railway → corduroy-api → Variables**:

| Name | Value |
|------|--------|
| `SUPABASE_URL` | `https://iggvqbqqzujixshiffqe.supabase.co` |
| `SUPABASE_ANON_KEY` | Publishable key from [Supabase API settings](https://supabase.com/dashboard/project/iggvqbqqzujixshiffqe/settings/api) |
| `CORS_ORIGINS` | `https://app.corduroytech.ai,https://staff.corduroytech.ai` |

Optional for local-style preview testing:

```
https://<vercel-project>.vercel.app
```

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` unless a specific server route needs admin access (none do yet).

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

## 5. Local development

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
| Build fails on `npm ci` | Ensure Dockerfile copies root `package-lock.json` |
| `Missing required env var` | Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in Railway |
| CORS errors from browser | Add the exact frontend origin to `CORS_ORIGINS` |
| `403 Wrong surface` | Client token on `/staff/*` or vice versa — by design |
