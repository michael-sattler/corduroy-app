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

## Local development (npm)

```bash
# From repo root
npm install
cp apps/web/.env.example apps/web/.env.local   # fill in after Supabase setup (A2)

npm run dev
```

Open:

- **Client dashboard:** http://app.localhost:3000/dashboard
- **Staff dashboard:** http://staff.localhost:3000/dashboard
- **Dev landing** (no subdomain): http://localhost:3000

Modern browsers resolve `*.localhost` to `127.0.0.1` without editing your hosts file. If subdomains do not resolve on your machine, add:

```
127.0.0.1 app.localhost
127.0.0.1 staff.localhost
```

## Docker (local dev container)

```bash
docker compose up --build
```

Dependencies are baked into the image at build time (avoids a slow `npm ci` on every start). Only `apps/web/src` is mounted for hot reload.

- http://localhost:3000
- http://app.localhost:3000/dashboard
- http://staff.localhost:3000/dashboard

For day-to-day dev on Windows, `npm run dev` is faster — no container needed until you want to test the Linux deploy path.

Production image: `docker compose --profile prod up --build`

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |

## Docs

- [Build plan](./docs/buildplan.md) — milestone checklist
- [TDD](./docs/tdd-platform.md) — platform architecture
- [Credentials](./docs/creds-platform.md) — vendor accounts (not committed)

## Current milestone

**A1** — Repository scaffold, Docker, subdomain routing, placeholder dashboards. Authentication (Supabase) follows in **A2–A4**.
