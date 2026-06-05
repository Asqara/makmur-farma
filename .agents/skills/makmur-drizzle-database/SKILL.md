---
name: makmur-drizzle-database
description: 'Design or change PostgreSQL schema safely with Drizzle: read related schema, map relations, define constraints and indexes, use timezone-aware timestamps and safe money types, include createdAt/updatedAt, draft migration plan, explain backward compatibility, and request approval before generating/applying migrations. No schema push.'
argument-hint: 'Schema or domain to change (example: orders, stock batches)'
---

# Makmur Drizzle Database Changes

## When to Use
- Adding or changing database schema
- Reviewing schema impact for domain changes

## Guardrails
- No schema push
- Ask approval before generating or applying migrations

## Procedure
1. Read all related schema files.
2. Identify relations and existing foreign keys.
3. Define required constraints and indexes.
4. Use timezone-aware timestamps.
5. Use safe money types for monetary fields.
6. Ensure createdAt and updatedAt are present where appropriate.
7. Draft a migration plan and describe data safety.
8. Explain backward compatibility and rollback strategy.
9. Request approval before migration generation or application.

## Output
- Proposed schema changes
- Migration plan and compatibility notes
- Explicit approval request before any migration action

## Quality Checks
- Constraints and indexes are defined intentionally
- Schema uses safe money types and timezone-aware timestamps
- Migration plan is documented before action
