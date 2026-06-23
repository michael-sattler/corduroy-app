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

## Docker (production image)

Build and run the production image locally:

```bash
# Create env file first (Supabase keys added in A2)
cp apps/web/.env.example apps/web/.env.local

docker compose up --build
```

The app listens on http://localhost:3000. Subdomain routing still applies — use `app.localhost:3000` and `staff.localhost:3000`.

For hot-reload development, use `npm run dev` instead of Docker.

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
