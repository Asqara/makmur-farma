# Client SDK

Business logic layer. Entry point: `Client` class in `index.ts`.

## Rules

- Never import client-side-only files (except shared utils).
- List methods take `searchParams: Record<string, unknown>`, parsed via `getFilters()`.
- Multi-class modules become folders: parent in `index.ts` references sub-classes as `static`.
- Initialize sub-classes inline in class body, never at module level.
