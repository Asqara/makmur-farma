---
name: makmur-elysia-module
description: 'Build backend modules aligned with Makmur Farma architecture: thin Elysia controllers, Zod request validation, auth middleware, permission checks, business logic in src/client, domain errors, typed responses, pagination, sorting, filtering, audit events, and integration tests. Reject DB queries or large business rules inside controllers.'
argument-hint: 'Module or route group to build (example: medicines, orders)'
---

# Makmur Elysia Module Builder

## When to Use
- Creating or refactoring API modules in src/api
- Adding new business operations that require controller + service changes

## Guardrails
- Controllers must stay thin
- No direct database queries in controllers
- No large business rules in controllers

## Procedure
1. Identify the route group and expected API contract.
2. Add request validation with Zod schemas.
3. Apply authentication middleware.
4. Enforce permission checks at the API layer.
5. Implement business logic in src/client.
6. Use domain-specific errors for validation and rules.
7. Return typed responses with explicit status codes.
8. Support pagination, sorting, and filtering for list endpoints.
9. Write audit events for sensitive changes.
10. Add or update integration tests for the new module.

## Output
- API controller in src/api
- Business logic in src/client
- Validation schemas (shared where needed)
- Tests covering critical paths

## Quality Checks
- Controller contains only routing/validation/auth/response glue
- Business logic is centralized and testable
- Pagination/sorting/filtering are validated
- Audit events present for sensitive actions
