# Makmur Farma

Sistem E-Commerce dan Manajemen Farmasi Klinik Makmur Jaya

See @CLAUDE.md for rules and constraints. See @DESIGN.md for design system.

## Requirements

- Node 22.0.0+
- pnpm 10.30.3+
- PostgreSQL 16+

## Setup

```sh
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

App runs at `http://localhost:3000`. Internal health check: `GET /api/__internal__/health`.

## Scripts

- `pnpm dev` start Next.js dev server
- `pnpm build` production build
- `pnpm start` start production server
- `pnpm tsc` typecheck
- `pnpm lint` lint
- `pnpm db:generate` create migrations from schema
- `pnpm db:migrate` apply migrations

## Structure

- `src/api/` Elysia backend
- `src/app/` Next.js pages
- `src/client/` business logic SDK
- `src/components/` shared components
- `src/constants/` constants
- `src/drizzle-schema/` database schema
- `src/hooks/` shared hooks
- `src/lib/` infrastructure utilities (server-only or client-only per file)
- `src/utils/` shared functions
- `src/zod-schemas/` validation schemas


