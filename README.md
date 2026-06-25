# Corduroy Platform

Monorepo for the Corduroy business advisory platform — one Next.js codebase serving the **client portal** and **staff console** on separate subdomains.

| Surface | Production | Local dev |
|---------|------------|-----------|
| Client | `app.corduroytech.ai` | `http://app.localhost:3000` |
| Staff | `staff.corduroytech.ai` | `http://staff.localhost:3000` |

## Repository layout

```
corduroy/
├── apps/web/          # Next.js App Router (client + staff surfaces)
├── apps/api/          # Fastify orchestration API (Railway)
├── docs/              # TDD, build plan, architecture
├── docker-compose.yml
└── package.json       # npm workspaces root
```

## Prerequisites

- Node.js 22+
- npm 10+
- Docker (optional, for containerized runs)

## Local development (npm) — recommended

```bash
# From repo root — required after clone, pull, or when package-lock.json changes
npm install
cp apps/web/.env.example apps/web/.env   # fill in after Supabase setup (A2)

npm run dev
```

**When do you need `npm install`?** Whenever `package.json` or `package-lock.json` changes — after `git pull`, or when a commit touches those files. If the app errors on a missing module (e.g. `@supabase/ssr`), run `npm install` and restart the dev server.

Open:

- **Client dashboard:** http://app.localhost:3000/dashboard
- **Staff dashboard:** http://staff.localhost:3000/dashboard
- **Dev landing** (no subdomain): http://localhost:3000

Modern browsers resolve `*.localhost` to `127.0.0.1` without editing your hosts file. If subdomains do not resolve on your machine, add:

```
127.0.0.1 app.localhost
127.0.0.1 staff.localhost
```

## Docker (optional)

```bash
npm run docker:dev
```

Starts **web** (port 3000) and **api** (port 4000) in Docker. On container start, each entrypoint checks `package-lock.json` and runs `npm ci` when dependencies changed — you do not need to remember `--build` for new packages.

- http://localhost:3000
- http://app.localhost:3000/dashboard
- http://staff.localhost:3000/dashboard
- http://localhost:4000/health — orchestration API

Stop: `npm run docker:down`

For day-to-day dev on Windows, `npm run dev` + `npm run dev:api` in a second terminal is faster. Use Docker when you want the full stack in containers.

Production images: `docker compose --profile prod up --build`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (recommended) |
| `npm run dev:api` | Start orchestration API on port 4000 |
| `npm run docker:dev` | Start web + API dev containers (ports 3000, 4000) |
| `npm run docker:down` | Stop Docker dev containers |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Sign in (production & local)

Dev seed users are documented in [supabase-setup.md](./docs/supabase-setup.md) (emails and passwords — not repeated here).

| Portal | Production | Local |
|--------|------------|-------|
| Client | https://app.corduroytech.ai/login | http://app.localhost:3000/login |
| Staff | https://staff.corduroytech.ai/login | http://staff.localhost:3000/login |

After sign-in you should land on `/dashboard` with your name visible. Client and staff sessions are isolated — a client token on `staff.*` (or vice versa) is signed out and redirected to login.

## Docs

- [Build plan](./docs/buildplan.md) — milestone checklist
- [TDD](./docs/tdd-platform.md) — platform architecture
- [Supabase setup](./docs/supabase-setup.md) — migrations, roles, dev seed users
- [Vercel deploy](./docs/vercel-deploy.md) — web app production
- [Railway deploy](./docs/railway-deploy.md) — orchestration API
- [Credentials](./docs/creds-platform.md) — vendor accounts (not committed)

## Current milestone

**Milestone B** — platform scaffolding (API shell on Railway, CI/CD, AWS skeleton, Phase 0 schema). B1 API shell is in the repo; deploy to Railway per [railway-deploy.md](./docs/railway-deploy.md).
