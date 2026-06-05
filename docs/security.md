# Security Modul Autentikasi

## Password

Password di-hash dengan Argon2id melalui `@node-rs/argon2` pada `@src/lib/password.ts`.

Kebijakan password:

- Minimal 10 karakter.
- Maksimal 128 karakter.
- Minimal tiga jenis karakter dari huruf kecil, huruf besar, angka, dan simbol.

Password plaintext, hash password, raw session token, raw verification token, dan CSRF token tidak dikirim ke client.

## SQL Injection

Query database menggunakan Drizzle ORM dan parameterized query. Login dan registrasi mencari user dengan `normalized_email`, bukan SQL string hasil concatenation.

## XSS

UI merender input user sebagai text React biasa. Modul ini tidak memakai `dangerouslySetInnerHTML`. Pesan error API memakai pesan aman dari domain error, bukan stack trace.

## CSRF

Karena session memakai cookie, mutation dilindungi oleh:

- `SameSite=Lax` pada cookie.
- Origin/Referer validation untuk public auth mutation.
- CSRF header `x-csrf-token` untuk authenticated mutation seperti logout.

Implementasi: `@src/lib/csrf.ts`.

## Brute Force

Rate limiting diterapkan untuk:

- Login.
- Registration.
- Email verification.
- Resend verification.

Redis digunakan bila `REDIS_URL` tersedia. Local development memakai memory fallback.

## Session Fixation

Login selalu membuat token session baru. Session token mentah hanya berada di cookie dan hash token disimpan di PostgreSQL.

## Open Redirect

Redirect login divalidasi oleh `@src/utils/redirects.ts`. URL eksternal, protocol-like URL, dan role-incompatible target ditolak dan diganti dengan default role destination.

## Account Enumeration

Login memakai pesan generik:

```text
Email atau password tidak sesuai.
```

Resend verification memakai pesan aman yang tidak mengungkap apakah email terdaftar.

## Sensitive Data Leakage

Audit metadata memakai email masking. Password, token, cookie, dan authorization header tidak dimasukkan ke audit log atau response body.

## Security Headers

`@next.config.ts` menambahkan:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `Referrer-Policy`
- `Permissions-Policy`
- `frame-ancestors 'none'`
