# API

Elysia backend. Mounted as catch-all Next.js route at `src/app/api/[[...slug]]/route.ts`.

## Layout

- `index.ts` root app
- `__internal__/v1` internal API (versioned)
- `middlewares/` shared middlewares (session, creator, admin)

## Rules

- One controller per file.
- Group with `app.group(prefix, ...)` only when 2+ routes share prefix.
- Sub-controllers under parameterized parents use standalone Elysia with full `prefix`.
- Inline middleware via `app.resolve()`. Shared middleware in `middlewares/`.
- Body schema required for non-read-only routes.
- Throw with classes from `@/lib/errors`.
