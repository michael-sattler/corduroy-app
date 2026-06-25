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

On container start, the entrypoint checks `package-lock.json`. If dependencies changed since the last run, it runs `npm ci` automatically — you do not need to remember `--build` for new packages.

- http://localhost:3000
- http://app.localhost:3000/dashboard
- http://staff.localhost:3000/dashboard

Stop: `npm run docker:down`

For day-to-day dev on Windows, `npm run dev` is faster. Use Docker when you want to test the Linux container path.

Production image: `docker compose --profile prod up --build`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server (recommended) |
| `npm run docker:dev` | Start dev server in Docker (auto-syncs deps) |
| `npm run docker:down` | Stop Docker dev container |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Docs

- [Build plan](./docs/buildplan.md) — milestone checklist
- [TDD](./docs/tdd-platform.md) — platform architecture
- [Supabase setup](./docs/supabase-setup.md) — migrations, roles, dev seed users
- [Credentials](./docs/creds-platform.md) — vendor accounts (not committed)

## Current milestone

**A6** — production smoke tests (login, session, cross-surface isolation). Deploy is live at `app.corduroytech.ai` and `staff.corduroytech.ai`. See [vercel-deploy.md](./docs/vercel-deploy.md) and [supabase-setup.md](./docs/supabase-setup.md).
