# Autentikasi Makmur Farma

Dokumen ini menjelaskan Modul 1 Autentikasi dan Keamanan yang diimplementasikan pada kode aplikasi.

## Role

Role internal:

- `ADMIN`
- `PHARMACIST`
- `CASHIER`
- `CUSTOMER`

Registrasi publik selalu membuat `CUSTOMER`. Role operasional dibuat melalui seed development atau modul manajemen pengguna.

## Registrasi

Alur registrasi pelanggan:

1. Pengguna membuka `@src/app/register/page.tsx`.
2. Frontend memvalidasi nama, email, telepon, password, konfirmasi password, dan persetujuan.
3. API `POST /api/v1/auth/register` memvalidasi ulang dengan Zod.
4. Email dinormalisasi ke `normalized_email`.
5. Password di-hash dengan Argon2id melalui `@src/lib/password.ts`.
6. User dibuat dengan role `CUSTOMER` dan status `PENDING_VERIFICATION`.
7. Token verifikasi acak dibuat, hash token disimpan di PostgreSQL, raw token hanya dikirim melalui email.
8. User diarahkan ke `@src/app/check-email/page.tsx`.

## Verifikasi Email

Endpoint `POST /api/v1/auth/verify-email` menerima token dari halaman `@src/app/verify-email/page.tsx`.

Token:

- Disimpan sebagai hash.
- Sekali pakai.
- Memiliki TTL default 60 menit.
- Mengaktifkan akun dengan mengisi `emailVerifiedAt`, `status = ACTIVE`, dan `isActive = true`.

Resend verification tersedia di `POST /api/v1/auth/resend-verification` dan memakai respons aman:

```text
Jika alamat email dapat digunakan, instruksi verifikasi akan dikirim.
```

## Login

Endpoint `POST /api/v1/auth/login`:

- Menggunakan pesan generik untuk email/password salah.
- Menolak akun yang belum verifikasi email.
- Menolak akun suspended/disabled.
- Membuat opaque session server-side.
- Mengatur cookie session HTTP-only dan cookie CSRF readable.
- Redirect berdasarkan role:
  - `ADMIN`, `PHARMACIST`, `CASHIER` -> `/dashboard`
  - `CUSTOMER` -> `/account`

## Session

Session menggunakan:

- Raw token hanya di cookie HTTP-only.
- Hash token di tabel `sessions`.
- Idle timeout default 30 menit.
- Absolute timeout default 12 jam.
- Revocation saat logout.
- Last-activity update yang dithrottle.

Frontend membaca user/session aman melalui `GET /api/v1/auth/session`. Token session tidak disimpan di localStorage/sessionStorage.

## Logout

`POST /api/v1/auth/logout` mencabut session aktif bila ditemukan, menghapus cookie, dan aman dipanggil berulang. Halaman `@src/app/logout/page.tsx` mengarahkan kembali ke login dengan pesan berhasil keluar.

## Route Protection

- `@src/proxy.ts` memblokir halaman protected tanpa cookie session.
- `@src/app/(dashboard)/layout.tsx` memvalidasi session melalui API dan hanya menampilkan shell operasional untuk `ADMIN`, `PHARMACIST`, dan `CASHIER`.
- `@src/app/account/page.tsx` khusus `CUSTOMER`.
- API protected memakai helper `@src/api/middlewares/session.ts`.

## Audit

Auth service di `@src/client/auth.ts` menulis audit event untuk registrasi, email verification, login, session creation, session expiry, dan logout. Metadata audit tidak menyimpan password, password hash, raw session token, raw verification token, CSRF token, cookie, atau authorization header.

## Demo Accounts

Seed development `@src/seed.ts` membuat akun fiktif:

| Role | Email |
| --- | --- |
| Admin | `admin@makmur-farma.test` |
| Apoteker | `apoteker@makmur-farma.test` |
| Kasir | `kasir@makmur-farma.test` |
| Pelanggan | `pelanggan@makmur-farma.test` |

Password demo: `Demo#12345`. Gunakan hanya untuk development/assessment lokal.

## Migration Status

Schema Drizzle auth sudah disiapkan di `@src/drizzle-schema/index.ts`. Migration SQL belum digenerate atau diaplikasikan karena `@AGENTS.md` mewajibkan persetujuan eksplisit sebelum generate/apply migration.
