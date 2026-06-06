# API Documentation

Base path: `/api`.

## Health Check

### `GET /api/__internal__/health`

Authentication: tidak diperlukan.

Response:

```json
{
  "app": "Makmur Farma",
  "status": "ok",
  "timestamp": "2026-06-05T00:00:00.000Z"
}
```

## Auth

### `POST /api/v1/auth/register`

Authentication: tidak diperlukan.

Body:

```json
{
  "fullName": "Budi Pelanggan",
  "email": "budi@example.test",
  "phone": "081234567890",
  "password": "MakmurFarma123!",
  "confirmPassword": "MakmurFarma123!",
  "termsAccepted": true
}
```

Response:

```json
{
  "email": "budi@example.test",
  "maskedEmail": "bu**@example.test",
  "message": "Registrasi berhasil. Silakan periksa email Anda."
}
```

Domain errors:

- `VALIDATION_ERROR`
- `CONFLICT`
- `RATE_LIMITED`

### `POST /api/v1/auth/login`

Authentication: tidak diperlukan.

Body:

```json
{
  "email": "admin@makmur-farma.test",
  "password": "Demo#12345",
  "redirectTo": "/dashboard"
}
```

Response sets:

- `mf_session` HTTP-only cookie.
- `mf_csrf` readable CSRF cookie.

Response body:

```json
{
  "redirectTo": "/dashboard",
  "user": {
    "id": "uuid",
    "name": "Admin Makmur",
    "email": "admin@makmur-farma.test",
    "role": "ADMIN",
    "status": "ACTIVE",
    "permissions": ["dashboard.read"]
  }
}
```

Domain errors:

- `AUTHENTICATION_ERROR`
- `EMAIL_NOT_VERIFIED`
- `ACCOUNT_DISABLED`
- `RATE_LIMITED`

### `GET /api/v1/auth/session`

Authentication: session cookie wajib.

Response:

```json
{
  "user": {
    "id": "uuid",
    "name": "Admin Makmur",
    "email": "admin@makmur-farma.test",
    "role": "ADMIN",
    "status": "ACTIVE"
  },
  "session": {
    "id": "uuid",
    "absoluteExpiresAt": "2026-06-05T12:00:00.000Z",
    "idleExpiresAt": "2026-06-05T00:30:00.000Z",
    "lastActivityAt": "2026-06-05T00:00:00.000Z"
  }
}
```

Domain errors:

- `UNAUTHORIZED`
- `SESSION_EXPIRED`

### `POST /api/v1/auth/logout`

Authentication: session cookie bila tersedia.

Header untuk session aktif:

```text
x-csrf-token: <value dari cookie mf_csrf>
```

Response clears auth cookies:

```json
{
  "message": "Anda telah keluar dari Makmur Farma."
}
```

Logout idempotent.

### `POST /api/v1/auth/verify-email`

Authentication: tidak diperlukan.

Body:

```json
{
  "token": "raw-email-verification-token"
}
```

Response:

```json
{
  "status": "verified"
}
```

Possible `status` values:

- `verified`
- `already_verified`

Domain errors:

- `INVALID_VERIFICATION_TOKEN`
- `VERIFICATION_TOKEN_EXPIRED`
- `RATE_LIMITED`

### `POST /api/v1/auth/resend-verification`

Authentication: tidak diperlukan.

Body:

```json
{
  "email": "budi@example.test"
}
```

Response:

```json
{
  "message": "Jika alamat email dapat digunakan, instruksi verifikasi akan dikirim."
}
```

## Notifications Overview

### `GET /api/notifications`

Authentication: session cookie wajib.

Permission: `notification.read`.

Query:

- `page`
- `limit`
- `isRead`
- `type`
- `severity`

Response:

```json
{
  "data": [
    {
      "id": "uuid",
      "type": "PRESCRIPTION_REVIEW",
      "title": "Resep Menunggu Verifikasi",
      "message": "Ada resep demo yang menunggu verifikasi apoteker.",
      "severity": "warning",
      "isRead": false,
      "createdAt": "2026-06-05T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 5,
    "total": 1,
    "totalPages": 1
  }
}
```

## Modul 2-5 Read APIs

All operational endpoints below require session cookie and role permission. List endpoints return:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

### `GET /api/v1/dashboard/overview`

Permission: `dashboard.read`.

Query:

- `from` optional `YYYY-MM-DD`
- `to` optional `YYYY-MM-DD`

Returns dashboard metrics, sales trend, order status distribution, recent orders, failed payments, and recent system errors.

### `GET /api/v1/catalog/medicines`

Authentication: tidak diperlukan.

Query:

- `search`
- `categoryId`
- `prescriptionRequired`
- `sortBy`: `name`, `price`, `createdAt`
- `sortDir`: `asc`, `desc`

Returns active medicines for the customer catalog.

### `GET /api/v1/medicines`

Permission: `medicine.read`.

Returns medicine master data with category, prescription flag, price, and aggregate batch stock.

### `POST /api/v1/medicines`

Permission: `medicine.write`.

Requires `x-csrf-token`.

Creates medicine master data. The endpoint validates code/slug uniqueness, active category, non-negative safe money value, and threshold ordering. It does not create or edit stock quantity.

### `GET /api/v1/medicines/:id`

Permission: `medicine.read`.

Returns one medicine with aggregate batch stock.

### `PUT /api/v1/medicines/:id`

Permission: `medicine.write`.

Requires `x-csrf-token`.

Updates medicine master data. Stock remains batch/movement based.

### `DELETE /api/v1/medicines/:id`

Permission: `medicine.delete`.

Requires `x-csrf-token`.

Soft-deactivates a medicine by setting status to `INACTIVE`; transaction history is preserved.

### `GET /api/v1/categories`

Permission: `category.read`.

Returns medicine categories.

### `POST /api/v1/categories`

Permission: `category.write`.

Requires `x-csrf-token`.

Creates a medicine category with unique code and slug.

### `GET /api/v1/categories/:id`

Permission: `category.read`.

Returns one medicine category.

### `PUT /api/v1/categories/:id`

Permission: `category.write`.

Requires `x-csrf-token`.

Updates category metadata.

### `DELETE /api/v1/categories/:id`

Permission: `category.write`.

Requires `x-csrf-token`.

Soft-deactivates a category.

### `GET /api/v1/suppliers`

Permission: `supplier.read`.

Returns suppliers.

### `POST /api/v1/suppliers`

Permission: `supplier.write`.

Requires `x-csrf-token`.

Creates a supplier with unique code.

### `GET /api/v1/suppliers/:id`

Permission: `supplier.read`.

Returns one supplier.

### `PUT /api/v1/suppliers/:id`

Permission: `supplier.write`.

Requires `x-csrf-token`.

Updates supplier metadata.

### `DELETE /api/v1/suppliers/:id`

Permission: `supplier.write`.

Requires `x-csrf-token`.

Soft-deactivates a supplier without deleting batch history.

### `GET /api/v1/customers`

Permission: `customer.read`.

Returns customer users with masked email for broad operational lists.

### `GET /api/v1/customers/:id`

Permission: `customer.read`.

Returns one customer detail from `users` plus `customer_profiles`.

### `GET /api/v1/batches`

Permission: `batch.read`.

Returns medicine batches with received date, expiry date, available quantity, reserved quantity, supplier, and status.

### `GET /api/v1/stock-movements`

Permission: `stock_movement.read`.

Returns stock movements. Stock changes must be represented by movement records.

### `GET /api/v1/orders`

Permission: `order.read`.

Returns order list with channel, customer, prescription flag, status, item count, and total.

### `GET /api/v1/orders/:id`

Permission: `order.read`.

Returns order aggregate detail: items, payments, prescriptions, and status history.

### `POST /api/v1/orders/:id/transition`

Permission: `order.process`.

Requires `x-csrf-token`.

Body:

```json
{
  "nextStatus": "PROCESSING",
  "note": "Pesanan mulai diproses."
}
```

Server validates the transition map and writes `order_status_history`, audit log, and customer notification when applicable.

### `GET /api/v1/payments`

Permission: `payment.read`.

Returns payment records with order reference, provider, method, amount, and payment status.

### `GET /api/v1/prescriptions`

Permission: `prescription.read`.

Returns prescription metadata and review status. It does not expose public prescription document URLs.

### `POST /api/v1/prescriptions/:id/review`

Permission: `prescription.verify`.

Requires `x-csrf-token`.

Body:

```json
{
  "decision": "APPROVED",
  "notes": "Resep sesuai dan dapat diproses.",
  "approvedItems": [
    {
      "medicineId": "uuid",
      "quantity": 1
    }
  ]
}
```

Decision values: `APPROVED`, `REJECTED`, `NEEDS_REVISION`.

The original prescription file is not modified. The endpoint writes `prescription_reviews`, updates prescription status, writes audit log, sends customer notification, and advances order status only through a valid transition.

### `POST /api/v1/notifications/read-all`

Permission: `notification.read`.

Requires `x-csrf-token`.

Marks all visible notifications for the current user/role audience as read.

### `POST /api/v1/notifications/scan-inventory`

Permission: `notification.read` and `batch.read`.

Role: `ADMIN` or `PHARMACIST`.

Requires `x-csrf-token`.

Runs low-stock and expiry notification scan from PostgreSQL and writes deduplicated in-app alerts for Admin and Pharmacist audiences.

### `GET /api/v1/reports`

Permission: `report.read`.

Returns report generation history.

### `POST /api/v1/reports`

Permission: `report.generate`.

Requires `x-csrf-token`.

Creates a queued report record for background generation.

### `GET /api/v1/reports/:id/download`

Permission: `report.read`.

Downloads the generated PDF when the report run is completed.

### `GET /api/v1/inventory/stock-sync`

Permission: `batch.read`.

Returns the latest stock movement watermark used by the dashboard shell for near-real-time stock refresh.

### `GET /api/v1/imports`

Permission: `import.read`.

Returns import run history.

### `POST /api/v1/imports`

Permission: `import.run`.

Requires `x-csrf-token`.

Creates an import run record. Row processing is delegated to the worker, which records row-level import results.

### `GET /api/v1/imports/:id/rows`

Permission: `import.read`.

Returns row-level import results.

### `GET /api/v1/jobs`

Permission: `monitoring.read`.

Returns persisted background job records.

### `GET /api/v1/monitoring`

Permission: `monitoring.read`.

Returns API/database/worker health derived from runtime, Redis worker heartbeat, and persisted job/error data. CPU and memory are not shown because no real data source is wired yet.

### `GET /api/v1/error-logs`

Permission: `error_log.read`.

Returns application error records with severity, source, safe message, correlation ID, and resolution state.

### `POST /api/v1/error-logs`

Permission: `error_log.read`.

Requires `x-csrf-token`.

Records an application error with safe message, severity, source, optional correlation ID, and optional diagnostic detail. Warning and critical errors create an Admin notification.

### `POST /api/v1/error-logs/:id/resolve`

Permission: `error_log.read`.

Requires `x-csrf-token`.

Marks an application error resolved with a resolution note and audit event.

### `POST /api/v1/error-logs/:id/ignore`

Permission: `error_log.read`.

Requires `x-csrf-token`.

Marks an application error ignored with a note and audit event.
