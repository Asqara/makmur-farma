# Drizzle Schema

PostgreSQL table definitions.

## Rules

- `timestampz` for timestamps.
- Every table has `createdAt` and `updatedAt`.
- Index frequently queried columns.
- Run `pnpm db:generate` then `pnpm db:migrate`. Never use `drizzle push`.
