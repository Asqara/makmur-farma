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
