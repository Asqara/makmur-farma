# Modul 2-5 Implementation Notes

Dokumen ini mencatat implementasi saat ini untuk dashboard, data transaksi, notifikasi, dan background processing.

## Modul 2 Dashboard dan Monitoring

Implemented source:

- Dashboard aggregate service: `@src/client/dashboard.ts`
- Dashboard API: `GET /api/v1/dashboard/overview`
- Dashboard UI: `@src/app/(dashboard)/dashboard/page.tsx`
- Monitoring API: `GET /api/v1/monitoring`
- Monitoring UI: `@src/app/(dashboard)/monitoring/page.tsx`

Dashboard uses database data from orders, payments, prescriptions, batches, jobs, and application errors.
Revenue excludes cancelled and unpaid orders.
Date grouping uses `APP_TIMEZONE`, defaulting to `Asia/Jakarta`.

## Modul 3 Data dan Transaksi

Implemented source:

- Database schema source for medicines, categories, suppliers, batches, stock movements, carts, orders, prescriptions, and payments.
- Query services: `@src/client/medicines.ts` and `@src/client/orders.ts`
- Domain rules: `@src/client/inventory-rules.ts` and `@src/client/order-rules.ts`
- Operational pages:
  - `@src/app/(dashboard)/medicines/page.tsx`
  - `@src/app/(dashboard)/categories/page.tsx`
  - `@src/app/(dashboard)/suppliers/page.tsx`
  - `@src/app/(dashboard)/batches/page.tsx`
  - `@src/app/(dashboard)/stock-movements/page.tsx`
  - `@src/app/(dashboard)/orders/page.tsx`
  - `@src/app/(dashboard)/payments/page.tsx`
  - `@src/app/(dashboard)/prescriptions/page.tsx`
- Customer catalog: `@src/app/catalog/page.tsx`

Stock allocation rules are expiry-aware and deterministic:

1. Earliest expiry date.
2. Earliest received date.
3. Stable batch ID.

All stock-changing schema paths are movement-based. The current UI does not expose direct stock editing.

## Modul 4 Notifications and Alerts

Implemented source:

- Notification schema source with dedupe key and delivery status fields.
- Notification service: `@src/client/notifications.ts`
- Notification overview endpoint: `GET /api/notifications`
- Notification API: `GET /api/v1/notifications`, `POST /api/v1/notifications/:id/read`
- Notification UI: `@src/app/(dashboard)/notifications/page.tsx`
- Error log schema/API/UI:
  - `application_errors`
  - `GET /api/v1/error-logs`
  - `@src/app/(dashboard)/error-logs/page.tsx`

Sensitive prescription content is not included in notification preview fields.

## Modul 5 Parallel Processing and Order Management

Implemented source:

- Job schema source: `job_runs`
- Job service: `@src/client/jobs.ts`
- Job UI: `@src/app/(dashboard)/jobs/page.tsx`
- Queue wrapper: `@src/lib/queue.ts`
- Worker entrypoint: `@src/worker.ts`
- Worker script: `pnpm worker`
- Import run service/UI:
  - `@src/client/imports.ts`
  - `@src/app/(dashboard)/imports/page.tsx`
- Report run service/UI:
  - `@src/client/reports.ts`
  - `@src/app/(dashboard)/reports/page.tsx`

The worker is wired to BullMQ with bounded retries and exponential backoff.
Domain-specific handlers for final PDF generation, row-level import processing, and email delivery are intentionally not marked complete until implemented.
Unsupported handlers record safe final failure instead of pretending the business effect succeeded.

## Tests

Current focused tests cover:

- Expiry-aware batch allocation.
- Rejection of expired/blocked batches.
- Stock level classification.
- Server-side order total calculation.
- Order transition validation.
- Payment callback idempotency helper.

Test files:

- `@src/client/inventory-rules.test.ts`
- `@src/client/order-rules.test.ts`

## Current Limitations

- Migration SQL for Modul 2-5 has not been generated or applied.
- Database runtime must be migrated before the new pages can load live data.
- Full CRUD mutation forms for medicines/categories/suppliers are not yet implemented.
- Checkout/cart mutation endpoints are not yet implemented.
- Payment provider callback verification is represented by domain rules and schema, but no provider adapter is active.
- Report PDF rendering is not yet implemented.
- CSV/XLSX row parsing and chunked worker processing are not yet implemented.
- Visual QA requires a migrated database and runnable local app session.
