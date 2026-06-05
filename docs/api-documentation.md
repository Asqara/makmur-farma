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

Modul ini hanya mengembalikan daftar kosong agar shell dashboard dapat berjalan. Implementasi notifikasi penuh berada di modul berikutnya.
