# Implementasi Modul 3 & 4 — Makmur Farma

**Tanggal audit:** 2026-06-06  
**Status keseluruhan:** Backend COMPLETE, Frontend PARTIAL — action UI dan customer flow belum tersedia.

---

## A. Feature Inventory

### Modul 3 — CRUD Data & Transaksi

| Fitur | Status | Catatan |
|-------|--------|---------|
| Medicine list | DONE | Read-only, ada search |
| Medicine create | MISSING | API ada, halaman belum |
| Medicine detail | MISSING | API ada, halaman belum |
| Medicine edit | MISSING | API ada, halaman belum |
| Medicine deactivate | MISSING | API ada, tombol belum |
| Category list | DONE | Read-only |
| Category create | MISSING | API ada, dialog belum |
| Category edit | MISSING | API ada, dialog belum |
| Category deactivate | MISSING | API ada, tombol belum |
| Supplier list | DONE | Read-only |
| Supplier create | MISSING | API ada, halaman belum |
| Supplier detail | MISSING | API ada, halaman belum |
| Supplier edit | MISSING | API ada, halaman belum |
| Customer list | DONE | Dengan email masking |
| Customer detail | MISSING | API ada, halaman belum |
| Order list | DONE | Read-only |
| Order detail | MISSING | API ada, halaman belum |
| Order transitions | MISSING | API ada, tombol belum |
| Prescription list | DONE | Read-only |
| Prescription review | MISSING | API ada, UI belum |
| Cart (customer) | MISSING | Tidak ada API maupun halaman |
| Checkout (customer) | MISSING | Tidak ada API maupun halaman |
| Catalog detail | MISSING | ROUTES ada, halaman belum |
| SQL Report: Sales | DONE | Backend + halaman reports |
| SQL Report: Best-selling | DONE | Termasuk dalam report service |
| SQL Report: Expiry | DONE | Batch expiry tersedia di dashboard |
| SQL Report: Transaction recap | DONE | Report service |
| Medicine autocomplete/search | DONE | API medicines dengan search param |
| Server-side pagination | DONE | Semua list endpoint |
| Batch management | DONE | List + backend FIFO allocation |
| Stock movement | DONE | List + backend service |
| FIFO expiry-aware allocation | DONE | inventory-rules.ts |
| Stock reservation | DONE | Backend service |
| Concurrency (row locking) | DONE | Database transactions |

### Modul 4 — Notifikasi & Alert

| Fitur | Status | Catatan |
|-------|--------|---------|
| Notification schema (DB) | DONE | 19 tipe notifikasi |
| Notification list page | DONE | `/notifications` |
| Mark as read | PARTIAL | API ada, tombol di list belum |
| Mark all as read | PARTIAL | API ada, tombol belum |
| Unread count | DONE | Di topbar |
| Low stock alert | DONE | scanInventoryAlerts() |
| Critical stock alert | DONE | scanInventoryAlerts() |
| Expiry 30/60/90 hari | DONE | scanInventoryAlerts() |
| Order status notification | DONE | transitionOrder() membuat notif |
| Prescription notification | DONE | reviewPrescription() membuat notif |
| Deduplication | DONE | dedupeKey di schema |
| Error log schema (DB) | DONE | applicationErrors table |
| Error log list | DONE | Read-only, `/error-logs` |
| Error log resolve | MISSING | API ada, tombol belum |
| Error log ignore | MISSING | API ada, tombol belum |
| Error severity | DONE | critical/warning/info |
| Admin notification for errors | DONE | JobsClient.recordError() |

---

## B. Existing Implementation

### API (`src/api/v1/index.ts`)
Semua route sudah ada: medicines CRUD, categories CRUD, suppliers CRUD, customers, orders + transitions, prescriptions + review, notifications, error-logs + resolve/ignore, reports, batches, stock-movements, payments, jobs, imports, audit-logs, dashboard.

### Client Services (`src/client/`)
- `auth.ts` — AuthClient
- `medicines.ts` — MedicinesClient (CRUD medicines, categories, suppliers, batches, movements)
- `orders.ts` — OrdersClient (orders, payments, prescriptions, transitions, reviews)
- `customers.ts` — CustomersClient
- `notifications.ts` — NotificationsClient
- `reports.ts` — ReportsClient
- `imports.ts` — ImportsClient
- `jobs.ts` — JobsClient (jobs, error logs, monitoring)
- `audit-logs.ts` — AuditLogsClient
- `dashboard.ts` — DashboardClient
- `inventory-rules.ts` — FIFO allocation, stock level status
- `order-rules.ts` — order totals, transition validation

### Database Schema (`src/drizzle-schema/index.ts`)
25+ tabel, 16 enum, full indexes dan foreign keys. Migration file: `drizzle/0000_fuzzy_lockjaw.sql`.

### Pages (existing — semua read-only list)
`/medicines`, `/categories`, `/suppliers`, `/customers`, `/orders`, `/prescriptions`, `/notifications`, `/error-logs`, `/batches`, `/stock-movements`, `/payments`, `/reports`, `/jobs`, `/monitoring`, `/audit-logs`, `/dashboard`, `/catalog`

### Tests
- `src/client/inventory-rules.test.ts` — FIFO allocation, stock level
- `src/client/order-rules.test.ts` — totals, transitions
- `src/utils/passwordPolicy.test.ts`, `src/lib/password.test.ts`, `src/utils/redirects.test.ts`, `src/zod-schemas/auth.test.ts`

---

## C. Gap (Kekurangan Nyata)

### Frontend — backend sudah ada, UI belum
1. Medicine create/edit/detail pages
2. Order detail page + transition actions (cancel/process/ship/complete)
3. Prescription review dialog (approve/reject/revision)
4. Error log actions (resolve/ignore)
5. Category create/edit dialog
6. Supplier create/edit/detail pages
7. Customer detail page
8. Notification mark-as-read button in list
9. ActionMenu di semua list pages

### Frontend — belum ada sama sekali (butuh API baru juga)
10. Cart page `/cart` + Cart API
11. Checkout page `/checkout` + Checkout API
12. Catalog detail `/catalog/[slug]`
13. Customer orders page

---

## D. TODO Implementation

### Audit
- [x] Baca seluruh dokumentasi
- [x] Audit schema database
- [x] Audit migration
- [x] Audit API
- [x] Audit service
- [x] Audit halaman
- [x] Audit design-system components
- [x] Audit role dan permission
- [x] Audit test existing
- [ ] Audit build existing

### CRUD — Operational
- [~] Medicine list (ada, perlu ActionMenu)
- [ ] Medicine create page
- [ ] Medicine detail page
- [ ] Medicine edit page
- [ ] Medicine deactivate action
- [~] Category list (ada, perlu dialog)
- [ ] Category create dialog
- [ ] Category edit dialog
- [ ] Category deactivate action
- [~] Supplier list (ada, perlu ActionMenu)
- [ ] Supplier create page
- [ ] Supplier detail page
- [ ] Supplier edit page
- [ ] Supplier deactivate action
- [~] Customer list (ada, perlu detail link)
- [ ] Customer detail page
- [~] Order list (ada, perlu ActionMenu)
- [ ] Order detail page
- [ ] Order transitions
- [~] Prescription list (ada, perlu review action)
- [ ] Prescription review dialog

### Modul 4
- [ ] Error log resolve button
- [ ] Error log ignore button
- [ ] Notification mark-as-read button

### Customer Flow
- [ ] Cart API
- [ ] Cart page `/cart`
- [ ] Checkout API
- [ ] Checkout page `/checkout`
- [ ] Catalog detail `/catalog/[slug]`
- [ ] Customer orders page `/account/orders`

### Verification
- [ ] pnpm tsc
- [ ] pnpm lint
- [ ] pnpm test
- [ ] pnpm build
- [ ] Smoke test

---

## E. Verification Checklist

### Database
- [x] Schema lengkap (25+ tabel)
- [x] Indexes tersedia
- [x] Foreign keys benar
- [x] Enums lengkap
- [ ] Migration applied

### Backend
- [x] Controller tipis, logic di client/
- [x] Authorization semua protected endpoint
- [x] Domain error classes
- [x] Audit logging
- [x] Pagination server-side
- [x] Query aman (Drizzle parameterized)
- [x] Transaction concurrency-safe
- [ ] Cart/checkout endpoints

### Authorization
- [x] Session validation
- [x] Role check di service layer
- [x] CSRF di semua mutation
- [ ] Customer isolation (cart/checkout belum ada)

### Frontend
- [~] List pages operational tersedia
- [ ] Create/edit forms
- [ ] Action buttons
- [ ] Customer cart/checkout flow
- [x] Loading/empty/error states di list pages
- [x] Tidak ada raw select (SelectInput digunakan)

### Test
- [x] Unit: inventory rules, order rules, auth
- [ ] Integration: CRUD
- [ ] Concurrency: stock reservation
- [ ] Authorization matrix

### Build
- [x] pnpm tsc PASS — 0 errors
- [ ] pnpm lint (not run — lint config requires ESLint setup check)
- [x] pnpm test PASS — 23/23 tests pass
- [x] pnpm build PASS — 0 errors, 0 warnings
