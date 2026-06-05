# Migration Plan

## Modul 1 Auth Schema

Status: schema source prepared in `@src/drizzle-schema/index.ts`; migration SQL has not been generated or applied yet.

`@AGENTS.md` requires explicit approval before generating or applying migrations. Do not run `pnpm db:generate` or `pnpm db:migrate` until approval is granted.

## Schema Impact

Auth implementation expects these PostgreSQL objects:

- `user_role` enum values:
  - `ADMIN`
  - `PHARMACIST`
  - `CASHIER`
  - `CUSTOMER`
- `user_status` enum:
  - `ACTIVE`
  - `PENDING_VERIFICATION`
  - `SUSPENDED`
  - `DISABLED`
- `audit_result` enum:
  - `SUCCESS`
  - `FAILED`
  - `BLOCKED`
- `users`
  - `name`
  - `email`
  - `normalized_email`
  - `phone`
  - `password_hash`
  - `role`
  - `status`
  - `is_active`
  - `email_verified_at`
  - `last_login_at`
  - `created_at`
  - `updated_at`
- `sessions`
  - `session_token_hash`
  - `csrf_token_hash`
  - `last_activity_at`
  - `idle_expires_at`
  - `expires_at`
  - `revoked_at`
  - `revoked_reason`
  - request metadata fields
- `email_verification_tokens`
- `audit_logs`

## Existing Migration Compatibility

The repository already has historical migrations with older SmartStock role values and partial auth tables. The forward migration should:

1. Add missing enum values rather than dropping existing enum values.
2. Add `user_status` and `audit_result`.
3. Add `users.normalized_email`, `users.phone`, `users.status`, and `users.email_verified_at`.
4. Backfill `normalized_email = lower(email)`.
5. Backfill `status`:
   - active existing users -> `ACTIVE`
   - inactive existing users -> `DISABLED`
6. Add a unique index on `normalized_email`.
7. Add `sessions.last_activity_at` and `sessions.revoked_reason`.
8. Create `email_verification_tokens`.
9. Add audit columns `actor_role`, `result`, and `correlation_id`.

## Data Safety

- Existing password hashes are not modified by the migration.
- Existing sessions may be preserved if their token hash and expiry fields are valid.
- Existing users with legacy roles need manual mapping before production use.
- Email uniqueness should be validated before adding `users_normalized_email_idx`.

## Rollback / Forward Fix

PostgreSQL enum value removal is not straightforward. Prefer forward-fix:

- If a role mapping is wrong, update affected `users.role` rows.
- If unique normalized email creation fails, resolve duplicates and rerun index creation.
- If auth deployment must be reverted, keep added nullable columns and disable new routes until a cleanup migration is approved.

## Approval Required

Before running migration generation/application, confirm:

```text
pnpm db:generate
pnpm db:migrate
```

No schema push should be used.

## Modul 2-5 Schema Source Update

Status: schema source has been extended in `@src/drizzle-schema/index.ts`; migration SQL has not been generated or applied.

New PostgreSQL objects expected by the current source:

- Enums:
  - `medicine_status`
  - `batch_status`
  - `stock_movement_type`
  - `order_channel`
  - `order_status`
  - `prescription_status`
  - `payment_status`
  - `payment_method`
  - `job_status`
  - `job_type`
  - `import_row_status`
  - `error_severity`
- Tables:
  - `customer_profiles`
  - `medicine_categories`
  - `suppliers`
  - `medicines`
  - `medicine_images`
  - `medicine_batches`
  - `carts`
  - `cart_items`
  - `orders`
  - `order_items`
  - `order_status_history`
  - `prescriptions`
  - `prescription_reviews`
  - `stock_reservations`
  - `stock_movements`
  - `payments`
  - `payment_events`
  - `report_runs`
  - `import_runs`
  - `import_row_results`
  - `job_runs`
  - `application_errors`
- Existing table changes:
  - `notifications.dedupe_key`
  - `notifications.delivery_status`
  - `notifications.email_status`

Data safety notes:

- Stock is batch-based; no medicine-level editable stock number is introduced.
- Opening stock from seed uses `IMPORT_OPENING` stock movements.
- Prescription file metadata is stored separately from prescription reviews.
- Payment status and order status remain separate.
- Job/report/import status is persisted in PostgreSQL; Redis queue state must not become business truth.

Index notes:

- Lookup and filter indexes are defined for status, created time, foreign keys, code/slug, order number, provider reference, job key, and import row identity.
- Unique constraints cover medicine/category/supplier codes, medicine slug, order number, provider reference, idempotency keys, batch number per medicine, and notification dedupe key.

Compatibility notes:

- This is a forward schema expansion. Existing Modul 1 auth tables remain in place.
- Historical deleted migration files in the current worktree must be reviewed before generation to avoid accidental migration history loss.
- `pnpm db:generate` should be reviewed before `pnpm db:migrate`.

Rollback / forward-fix:

- Prefer forward-fix migrations for enum/table changes.
- If generated SQL conflicts with existing database history, stop before apply and reconcile migration metadata.
- Do not use schema push.
