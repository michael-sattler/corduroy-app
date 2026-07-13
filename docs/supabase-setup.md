# Supabase setup — corduroy-app

Project ref: `iggvqbqqzujixshiffqe`  
Dashboard: [supabase.com/dashboard/project/iggvqbqqzujixshiffqe](https://supabase.com/dashboard/project/iggvqbqqzujixshiffqe)

## 1. Dashboard (one-time)

In **Authentication → Providers**, enable **Email** with password sign-in.

Optional for v1: disable “Confirm email” under provider settings so dev logins work immediately.

## 2. Environment variables

Copy keys from **Project Settings → API**:

```bash
cp apps/web/.env.example apps/web/.env.local
# Fill NEXT_PUBLIC_SUPABASE_ANON_KEY (publishable key)

cp .env.example .env
# Fill SUPABASE_SERVICE_ROLE_KEY for seeding only
```

Never commit `.env` or `.env.local`. Never put the service role key in the frontend.

## 3. Link CLI and push migrations

The CLI stores the project link **on your machine only** (`supabase/.temp/`, gitignored). Every developer must run this once per clone:

```bash
npm install

# 1. Log in (opens browser)
npx supabase login

# 2. Link to corduroy-app — prompts for your database password
#    Dashboard → Project Settings → Database → Database password
npm run db:link

# 3. Apply migrations
npm run db:push
```

If `db:push` says **"Cannot find project ref. Have you run supabase link?"**, step 2 didn’t complete — run `npm run db:link` again after `supabase login`.

### `db:push` fails with `unexpected login role status 403`

Recent Supabase CLI versions create a temporary database role via the **Management API** (`Initialising login role...`). That call returns 403 when:

- Your Supabase login is not a **member of the project org** with sufficient privileges, or
- You are linked to a project you cannot manage (check with `npx supabase projects list` — `iggvqbqqzujixshiffqe` / corduroy-app must appear).

**Fix A — use the correct Supabase account**

```bash
npx supabase login
npx supabase projects list   # corduroy-app must be listed
npm run db:link
npm run db:push
```

**Fix B — bypass the login-role API with the database password**

Dashboard → **Project Settings → Database** → database password (reset if unknown).

PowerShell:

```powershell
$env:SUPABASE_DB_PASSWORD = "your-database-password"
npm run db:push
```

Or add `SUPABASE_DB_PASSWORD=...` to `.env` and run from a shell that loads it.

**Fix C — direct connection string (CI / stubborn pooler issues)**

Dashboard → **Project Settings → Database** → **Connection string** → **Session pooler** (IPv4) or **Direct** (IPv6). Then:

```powershell
npx supabase db push --linked --yes --db-url "postgresql://postgres.iggvqbqqzujixshiffqe:[PASSWORD]@[HOST]:5432/postgres"
```

URL-encode special characters in the password (`@` → `%40`, etc.).

**Fix D — SQL Editor (no CLI)**

Paste each pending file under `supabase/migrations/` into  
[SQL Editor](https://supabase.com/dashboard/project/iggvqbqqzujixshiffqe/sql/new) and run in filename order.

---

This applies `supabase/migrations/20260623170000_core_auth_schema.sql`:

| Table | Purpose |
|-------|---------|
| `clients` | One row per client engagement (isolation key) |
| `client_users` | Maps `auth.users` → `clients` |
| `staff` | Corduroy staff; `approved` gates new staff |
| `staff_assignments` | Which staff can access which clients |

Row-level security is enabled on all four tables.

### Alternative: run migration in the Dashboard

If the CLI link is blocked, paste the contents of  
`supabase/migrations/20260623170000_core_auth_schema.sql` into  
[SQL Editor](https://supabase.com/dashboard/project/iggvqbqqzujixshiffqe/sql/new) and run it, then `npm run db:seed`.

## 4. Roles (`app_metadata`)

Set on each auth user (seed script does this automatically):

| Role | `app_metadata` | Surface |
|------|----------------|---------|
| Client | `{ "role": "client", "client_id": "<uuid>" }` | `app.*` |
| Staff | `{ "role": "staff", "staff_role": "advisor" }` | `staff.*` |

Staff must also have a `staff` row with `approved = true`. New `@corduroytech.ai` signups stay blocked until an admin approves them (enforced in app login — milestone A4).

## 5. Seed dev users

```bash
# Requires SUPABASE_SERVICE_ROLE_KEY in .env or shell env
npm run db:seed
```

Creates:

| User | Password | Notes |
|------|----------|-------|
| `client@acmecorp.test` | `CorduroyDev2026!` | Client user for All-American Fitness |
| `advisor@corduroytech.ai` | `CorduroyDev2026!` | Approved staff, assigned to All-American Fitness |

Re-running the seed is idempotent.

## 6. Test login locally (A4)

```bash
npm run dev
```

| Portal | URL | Test user |
|--------|-----|-----------|
| Client | http://app.localhost:3000/login | `client@acmecorp.test` / `CorduroyDev2026!` |
| Staff | http://staff.localhost:3000/login | `advisor@corduroytech.ai` / `CorduroyDev2026!` |

Cross-surface check: signing in as the client user on `staff.localhost` should fail with an error.

## 7. Production auth URLs (A5)

In [Authentication → URL Configuration](https://supabase.com/dashboard/project/iggvqbqqzujixshiffqe/auth/url-configuration):

**Site URL:**

```
https://app.corduroytech.ai
```

**Redirect URLs** (add each):

```
https://app.corduroytech.ai/**
https://staff.corduroytech.ai/**
```

Until staging DNS exists, also add your Vercel preview host if you test on `*.vercel.app`:

```
https://<project>.vercel.app/**
```

## 8. Test login on production (A6)

| Portal | URL | Test user |
|--------|-----|-----------|
| Client | https://app.corduroytech.ai/login | `client@acmecorp.test` / see seed table above |
| Staff | https://staff.corduroytech.ai/login | `advisor@corduroytech.ai` / see seed table above |

## Next milestone

**A6** — smoke tests on production (session persistence, cross-surface isolation).
