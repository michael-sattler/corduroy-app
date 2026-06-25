# Railway deploy — Milestone B1

Orchestration API (`apps/api`) for business logic, plan generation, and audit writes. Runs separately from the Next.js app on Vercel.

## 1. Create the Railway service

1. Log in at [railway.com](https://railway.com)
2. **New Project → Deploy from GitHub repo** → `michael-sattler/corduroy-app`
3. Add a service for the API:
   - **Root Directory:** `/` (repo root)
   - **Dockerfile path:** `apps/api/Dockerfile`
   - **Service name:** `corduroy-api` (or match your creds doc)

Railway sets `PORT` automatically — the API reads `process.env.PORT`.

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
