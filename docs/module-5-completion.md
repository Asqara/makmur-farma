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
- [x] Audit queue and worker: BullMQ wrapper exists in `src/lib/queue.ts`; worker exists in `src/worker.ts`; domain handlers still partial.
- [x] Audit orders: online cart/checkout and cashier checkout exist; concurrency behavior still needs integration tests against PostgreSQL.
- [x] Audit payments: QRIS simulator and payment override exist; queued payment processing is missing.
- [x] Audit inventory synchronization: stock is PostgreSQL-backed and movement-based; realtime/SSE delivery is missing.
- [x] Audit imports: import run schema/service/page exist; row parsing and chunked processing are missing.
- [x] Audit reports: report run schema/service/page exist; PDF generation worker is missing.
- [x] Audit monitoring: monitoring API/UI exist and use PostgreSQL/Redis/job/error data; worker heartbeat is missing.
- [x] Audit prescriptions: schema/API/list page/review API exist; customer prescription history and revision flow are missing.
- [x] Audit users: route constant exists; admin user-management API/page are missing.
- [x] Audit logout: server logout exists; client cache cleanup was incomplete and has been repaired.
- [x] Audit overlays: select/date panels use portals; z-index was hardcoded and has been centralized.
- [x] Audit public routing: `/` redirected to dashboard and has been replaced with a public landing page.
- [x] Audit account history: account page exists but purchase history remains placeholder.
- [x] Audit API documentation: `@elysia/openapi` installed but not mounted; docs are now mounted.

## Module 5

- [~] Queue infrastructure: BullMQ queues exist; report/import requests now create `job_runs` and enqueue jobs.
- [~] Worker process: `pnpm worker` exists and consumes queues; report/import business handlers still fail safely as unsupported.
- [x] Typed job payloads: `QueueJobEnvelope` added with safe small fields.
- [~] Job idempotency: report/import jobs use deterministic BullMQ `jobId` values based on persisted `job_runs.jobKey`.
- [x] Retry and backoff: queue defaults use bounded attempts and exponential backoff.
- [~] Parallel order handling: shared inventory/order services exist; concurrency tests are not complete.
- [ ] Payment jobs.
- [ ] Automatic stock finalization through queued payment jobs.
- [ ] Reservation expiry worker.
- [ ] Real-time stock synchronization.
- [ ] CSV import row processing.
- [ ] Excel import row processing.
- [ ] Column mapping UI beyond stored mapping payload.
- [ ] Row validation worker.
- [ ] Bounded import concurrency worker.
- [ ] Partial import result production.
- [ ] Background report PDF generation.
- [~] Job monitoring: persisted job list and queue counts exist; heartbeat is missing.
- [~] Failed-job inspection: jobs page exists; safe retry action is missing.
- [ ] Safe job retry action.

## Existing Defects

- [x] Stock-movement date range uses the shared date component (`DateInput` range mode) with presets and clear action.
- [~] API-backed searches use shared `useDebounce`: repaired catalog, medicines, customers, cashier searches, stock movements, expiry monitoring, and audit logs. Remaining pages still require full audit.
- [~] Monitoring page works with real PostgreSQL/Redis/job/error values; worker heartbeat is missing.
- [~] Prescription workflow partially exists; customer revision/history is missing.
- [ ] Pharmacist action UI completion.
- [ ] Customer prescription actions.
- [ ] Admin user list.
- [ ] User CRUD.
- [x] Settings removed from sidebar.
- [x] Logout clears React Query cache after session revoke.
- [ ] Real-time connections closed at logout.
- [x] Overlay z-index tokens implemented.
- [ ] Nested overlays browser-tested.
- [x] Root landing page is public.
- [x] Clinic profile added to public landing page.
- [x] Catalog CTA added to public landing page.
- [ ] Dashboard charts fully improved.
- [ ] Purchase history fixed.
- [ ] Prescription history implemented.
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

The worker marks jobs as `PROCESSING` and then fails unsupported handlers with safe messages. This is honest partial behavior and prevents false completion claims for reports/imports until domain processors are implemented.

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
- Worker processors for PDF reports, CSV/XLSX import rows, payment follow-up, reservation expiry, and notifications are still incomplete.
- Realtime stock synchronization is not implemented.
- Monitoring worker heartbeat is not implemented.
- Admin user management remains missing.
- Customer purchase history and prescription history remain missing.
- OpenAPI is mounted, but full per-endpoint schemas and operation metadata are not complete.
- Runtime verification was limited to standalone HTTP smoke checks for `/` and `/api/v1/docs/json`, plus worker startup. Full browser-console and responsive visual QA were not run because browser control was unavailable in this tool set.
