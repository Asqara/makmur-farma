# Module 5 Completion Tracking

Tanggal audit: 2026-06-06

Status ini mencatat hasil audit dan perbaikan yang sudah diverifikasi selama pengerjaan ini. Item tidak ditandai selesai bila efek bisnis atau alur UI belum diuji.

## Status Legend

- `[ ] Not started`
- `[~] In progress`
- `[x] Implemented and verified`
- `[!] Blocked`

## Audit

- [x] Read all project documentation: `AGENTS.md`, `DESIGN.md`, `README.md`, and current docs under `docs/`.
- [x] Audit queue and worker: BullMQ wrapper exists in `src/lib/queue.ts`; worker exists in `src/worker.ts`; import processors perform business effects, while report PDF now completes inline and renders in memory on download.
- [x] Audit orders: online cart/checkout and cashier checkout use shared batch stock workflow; concurrency behavior still needs integration tests against PostgreSQL.
- [x] Audit payments: QRIS simulator, payment override, payment expiry scan, and stock reservation release/finalization are implemented for the demo provider.
- [x] Audit inventory synchronization: stock is PostgreSQL-backed and movement-based; dashboard shell now polls a stock watermark and refreshes stock-sensitive queries.
- [x] Audit imports: import run schema/service/page exist; CSV/XLSX row parsing and row-result production are implemented in the worker.
- [x] Audit reports: report run schema/service/page exist; PDF generation worker and download endpoint are implemented.
- [x] Audit monitoring: monitoring API/UI exist and use PostgreSQL/Redis/job/error data; worker heartbeat is implemented.
- [x] Audit prescriptions: schema/API/list page/review API exist; customer prescription history is implemented; revision flow is still not implemented.
- [x] Audit users: admin user-management API/page are implemented.
- [x] Audit logout: server logout exists; client cache cleanup was incomplete and has been repaired.
- [x] Audit overlays: select/date panels use portals; z-index was hardcoded and has been centralized.
- [x] Audit public routing: `/` redirected to dashboard and has been replaced with a public landing page.
- [x] Audit account history: account page shows customer purchase and prescription history.
- [x] Audit API documentation: `@elysia/openapi` installed but not mounted; docs are now mounted.

## Module 5

- [x] Queue infrastructure: BullMQ queues exist; import requests create `job_runs` and enqueue jobs. Report requests create job metadata but do not depend on Redis/worker for PDF availability.
- [x] Worker process: `pnpm worker` exists and consumes queues; report/import handlers and maintenance scans are implemented.
- [x] Typed job payloads: `QueueJobEnvelope` added with safe small fields.
- [x] Job idempotency: import jobs use deterministic BullMQ `jobId` values based on persisted `job_runs.jobKey`; report runs are idempotent through persisted report metadata and in-memory PDF rendering.
- [x] Retry and backoff: queue defaults use bounded attempts and exponential backoff.
- [~] Parallel order handling: shared inventory/order services exist; focused PostgreSQL concurrency tests are not complete.
- [x] Payment jobs: worker maintenance scan expires overdue demo payments and records payment events.
- [x] Automatic stock finalization through payment workflow.
- [x] Reservation expiry worker.
- [x] Near-real-time stock synchronization.
- [x] CSV import row processing.
- [x] Excel import row processing.
- [ ] Column mapping UI beyond stored mapping payload.
- [x] Row validation worker.
- [x] Bounded import concurrency worker.
- [x] Partial import result production.
- [x] Background report PDF generation.
- [x] Job monitoring: persisted job list and queue counts exist; heartbeat is implemented.
- [~] Failed-job inspection: jobs page exists; safe retry action is missing.
- [ ] Safe job retry action.

## Existing Defects

- [x] Stock-movement date range uses the shared date component (`DateInput` range mode) with presets and clear action.
- [~] API-backed searches use shared `useDebounce`: repaired catalog, medicines, customers, cashier searches, stock movements, expiry monitoring, and audit logs. Remaining pages still require full audit.
- [x] Monitoring page works with real PostgreSQL/Redis/job/error/heartbeat values.
- [~] Prescription workflow partially exists; customer history exists, but customer revision action is missing.
- [ ] Pharmacist action UI completion.
- [ ] Customer prescription actions.
- [x] Admin user list.
- [x] User CRUD.
- [x] Settings removed from sidebar.
- [x] Logout clears React Query cache after session revoke.
- [ ] Real-time connections closed at logout.
- [x] Overlay z-index tokens implemented.
- [ ] Nested overlays browser-tested.
- [x] Root landing page is public.
- [x] Clinic profile added to public landing page.
- [x] Catalog CTA added to public landing page.
- [ ] Dashboard charts fully improved.
- [x] Purchase history fixed.
- [x] Prescription history implemented.
- [x] OpenAPI docs available at `/api/v1/docs`.
- [~] Request schemas documented: plugin mounted, but route-level schemas are still incomplete for many endpoints.
- [~] Response schemas documented: plugin mounted, but route-level response schemas are still incomplete for many endpoints.

## Verification

- [x] Typecheck passes: `pnpm tsc` completed successfully after changes.
- [x] Lint passes.
- [x] Unit tests pass.
- [ ] Integration tests pass.
- [ ] Concurrency tests pass.
- [ ] E2E tests pass.
- [x] Build passes.
- [x] Worker smoke test passes.
- [ ] Monitoring smoke test passes.
- [ ] Browser console is clean.
- [x] API docs JSON loads by HTTP smoke test.
- [~] OpenAPI JSON is reachable; full schema validation was not run.
- [ ] Responsive checks pass.
- [x] No migration applied without permission.

## Current Implementation Notes

### Queue and Worker

`src/lib/queue.ts` defines queue names and a typed `QueueJobEnvelope`. `ReportsClient.requestReport()` and `ImportsClient.requestImport()` now create both business run records and persisted `job_runs`, then enqueue BullMQ jobs with deterministic job IDs.

The worker marks jobs as `PROCESSING`, generates sales report PDFs, parses CSV/XLSX imports, records row-level import results, publishes a Redis heartbeat, and runs maintenance scans for expired payments and reservations.

### UI Repairs

`/stock-movements` no longer uses raw date inputs. It uses the shared date-range control, quick presets, clear action, debounced search, and sends validated date strings to the backend. The server converts the end date to end-of-day for inclusive filtering.

The root route is now a public Makmur Farma landing page with clinic identity, catalog CTA, clinic profile, services, prescription explanation, pickup information, and footer.

Overlay layers are centralized in `src/constants/design.ts` and used by dialogs, mobile drawer, select panels, date panels, and notification popover.

### OpenAPI

`@elysia/openapi` is mounted in `src/api/index.ts`:

- UI: `/api/v1/docs`
- JSON: `/api/v1/docs/json`
- Provider: Swagger UI
- Flag: `ENABLE_API_DOCS`

Route-level request/response schema completeness remains partial because existing Elysia routes do not yet declare full schemas for every status code.

## Remaining Limitations

- No database migration was generated or applied.
- External payment-provider follow-up is not implemented because no real provider adapter is active; the demo worker handles payment expiry and simulator callbacks.
- Stock synchronization is near-real-time polling through a stock movement watermark, not WebSocket/SSE push.
- Admin user management covers list/create/update/status/role, but hard delete is intentionally not implemented.
- Customer prescription revision actions remain missing.
- OpenAPI is mounted, but full per-endpoint schemas and operation metadata are not complete.
- Runtime verification was limited to standalone HTTP smoke checks for `/` and `/api/v1/docs/json`, plus worker startup. Full browser-console and responsive visual QA were not run because browser control was unavailable in this tool set.
