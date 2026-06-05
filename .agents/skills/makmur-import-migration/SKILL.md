---
name: makmur-import-migration
description: 'Design CSV/Excel import flows: templates, column mapping, preview, validation, row errors, background import, opening stock movements, rollback plan, and audit logging.'
argument-hint: 'Import type or dataset (example: medicines, suppliers)'
---

# Makmur Import and Migration

## When to Use
- Adding or updating CSV/Excel imports
- Migrating legacy data into the system

## Coverage
- Import templates
- Column mapping
- Preview
- Validation and row errors
- Background processing
- Opening stock movements
- Rollback plan
- Audit logs

## Procedure
1. Define the import template and required columns.
2. Map columns to schema fields and validate types.
3. Implement preview and row-level validation.
4. Surface row errors clearly and exportable.
5. Run import in background jobs.
6. Convert opening stock into explicit movements.
7. Define rollback and reconciliation steps.
8. Write audit events for import actions.

## Output
- Import flow summary
- Validation and error handling rules
- Rollback and audit notes

## Quality Checks
- Invalid rows do not silently import
- Stock is updated via movements only
- Background job records status and results
