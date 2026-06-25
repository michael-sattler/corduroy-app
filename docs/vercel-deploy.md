# Vercel deploy — Milestone A5

Deploy the single Next.js app to both production subdomains.

## 1. Import project (Vercel dashboard)

1. Log in at [vercel.com](https://vercel.com) (`msattler@corduroytech.ai`)
2. **Add New → Project** → import `michael-sattler/corduroy-app`
3. **Root Directory:** `apps/web` → Edit → set to `apps/web`, confirm
4. Enable **Include source files outside of the Root Directory** (required for npm workspaces)
5. Framework: **Next.js** (auto-detected)

Build settings (should default correctly):

| Setting | Value |
|---------|--------|
| Install Command | `npm ci` (runs from repo root when outside-root is enabled) |
| Build Command | `npm run build` |
| Output Directory | *(leave default — Vercel handles Next.js)* |

## 2. Environment variables

In **Project → Settings → Environment Variables**, add for **Production** (and Preview if you want PR deploys):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iggvqbqqzujixshiffqe.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Current publishable key from [Supabase API settings](https://supabase.com/dashboard/project/iggvqbqqzujixshiffqe/settings/api) — must match `apps/web/.env` locally |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key from Supabase API settings — **server only**; required for staff admin provisioning (create portal/staff users, “View as client” impersonation). Never expose as `NEXT_PUBLIC_*`. |
| `ORCHESTRATION_API_URL` | *(Optional)* Public Railway API URL — only used by the admin **health check** card. Staff admin data reads/writes go to Supabase directly; omit until Railway is connected. |

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` to client bundles or `NEXT_PUBLIC_*` vars.

**Important:** Supabase publishable keys can be rotated. If login works locally but not on Vercel, compare keys character-for-character. An old/revoked key returns auth failures on Vercel (often shown as "Invalid email or password" or "Unregistered API key" in logs).

Redeploy after adding or changing env vars.

## 3. Custom domains

In **Project → Settings → Domains**, add both:

- `app.corduroytech.ai`
- `staff.corduroytech.ai`

Vercel shows DNS records (usually `CNAME` → `cname.vercel-dns.com`). Add them at your DNS host for `corduroytech.ai`.

Wait for SSL provisioning (automatic once DNS propagates).

## 4. Supabase Auth URLs (required for login on production)

In [Supabase → Authentication → URL Configuration](https://supabase.com/dashboard/project/iggvqbqqzujixshiffqe/auth/url-configuration):

**Site URL:**

```
https://app.corduroytech.ai
```

**Redirect URLs** (add each):

```
https://app.corduroytech.ai/**
https://staff.corduroytech.ai/**
```

Save. Without this, production sign-in may fail or redirect incorrectly.

## 5. Deploy

Push to `main` (or click **Deploy** in Vercel). First production deploy may take a few minutes.

## 6. Staging (deferred)

Staging subdomains (`app.staging.corduroytech.ai`, `staff.staging.corduroytech.ai`) are not configured yet. Until then:

- Use Vercel preview deploys on `*.vercel.app` with path prefixes (`/app`, `/staff`)
- Add `https://<project>.vercel.app/**` to Supabase redirect URLs when testing previews

## 7. Smoke test (A6)

| Check | URL | User |
|-------|-----|------|
| Client login | https://app.corduroytech.ai/login | `client@acmecorp.test` |
| Staff login | https://staff.corduroytech.ai/login | `advisor@corduroytech.ai` |

Passwords: see [supabase-setup.md](./supabase-setup.md) (dev seed users).

Also verify:

- Refresh on `/dashboard` keeps you signed in
- Client user on `staff.*` is rejected (redirect to staff login)
- Staff user on `app.*` is rejected (redirect to client login)

### Verified (2026-06-25)

| Test | Result |
|------|--------|
| Client login → dashboard (production) | Pass — shows Jane Client / Acme Corp |
| Session survives reload on `/dashboard` | Pass |
| Client session on `staff.corduroytech.ai/dashboard` | Pass — redirected to staff login |
| Staff + client Auth API (`signInWithPassword`) | Pass — both return correct `role` |
| Service role key absent from `apps/web` source and `.next` build | Pass |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on monorepo imports | Confirm Root Directory = `apps/web` and outside-root include is on |
| Login works locally, not on Vercel | Check Vercel env vars; redeploy; verify Supabase redirect URLs |
| `Your project's URL and Key are required` after sign-in | `NEXT_PUBLIC_*` vars missing at **build** time — add in Vercel env (Production + Preview), then **Redeploy** (not just promote) |
| `Invalid supabaseUrl` in middleware logs | `NEXT_PUBLIC_SUPABASE_URL` is empty, has quotes, or missing `https://`. Set exactly `https://iggvqbqqzujixshiffqe.supabase.co` — no quotes, no trailing spaces — for **Production**, then redeploy |
| 404 on `/admin/clients` or `/admin/staff` | Stale Vercel deployment — confirm Production build includes those routes; redeploy from latest `main` |
| Admin pages error after login | Run Supabase migrations (`npm run db:push`); confirm staff RLS policies applied |
| “View as client” / create user fails | Add `SUPABASE_SERVICE_ROLE_KEY` to Vercel (server env only), redeploy |
| Admin health shows API “down” | Expected until Railway is connected; set `ORCHESTRATION_API_URL` after [railway-deploy.md](./railway-deploy.md) |
| Wrong portal branding | You may be on the wrong subdomain — client = `app.*`, staff = `staff.*` |

## Vercel preview without custom DNS

On `*.vercel.app` hosts, subdomain routing is not available. The app automatically uses path prefixes instead:

| Portal | URL |
|--------|-----|
| Landing | `https://<project>.vercel.app/` |
| Client | `https://<project>.vercel.app/app/dashboard` |
| Staff | `https://<project>.vercel.app/staff/dashboard` |

Add these to Supabase **Redirect URLs** (in addition to production domains when ready):

```
https://<project>.vercel.app/**
```

Share `/app` and `/staff` links with reviewers until `app.corduroytech.ai` / `staff.corduroytech.ai` DNS is configured. Production subdomains take precedence when custom domains are added — path routing only applies on bare `*.vercel.app` hosts.
