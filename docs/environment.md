# Environment Variables

## Database

```text
DATABASE_URL
DATABASE_URL_READ
```

PostgreSQL adalah sumber kebenaran untuk user, session, token verifikasi email, dan audit log.

## Application URL

```text
APP_PUBLIC_URL
NEXT_PUBLIC_APP_URL
APP_URL
APP_TIMEZONE=Asia/Jakarta
```

`APP_PUBLIC_URL` digunakan untuk membuat tautan verifikasi email. `NEXT_PUBLIC_APP_URL` digunakan oleh metadata/client fallback.
`APP_TIMEZONE` digunakan untuk agregasi dashboard dan format periode operasional server-side.

## Auth

```text
AUTH_SESSION_COOKIE_NAME=mf_session
AUTH_SESSION_IDLE_TIMEOUT_MINUTES=30
AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS=12
AUTH_EMAIL_VERIFICATION_TTL_MINUTES=60
```

Nilai default modul:

- Idle timeout: 30 menit.
- Absolute timeout: 12 jam.
- Email verification TTL: 60 menit.

## Redis

```text
REDIS_URL
```

Digunakan untuk rate limiting bila tersedia. Tanpa Redis, local development memakai memory fallback.

## SMTP

```text
SMTP_HOST
SMTP_PORT
SMTP_USERNAME
SMTP_PASSWORD
SMTP_FROM_EMAIL
SMTP_FROM_NAME
```

Alias lama yang masih dibaca:

```text
SMTP_USER
SMTP_PASS
SMTP_FROM
```

Jika SMTP tidak dikonfigurasi di development, aplikasi menulis preview URL verifikasi ke log. Di production, SMTP wajib dikonfigurasi agar email verifikasi dapat dikirim.

## Object Storage

Cloudflare R2 digunakan sebagai object storage S3-compatible untuk file privat seperti resep dan objek upload lain. Export laporan PDF tidak lagi membutuhkan penyimpanan permanen: PDF dibuat di memori saat download dan metadata report tetap disimpan di database. Jika variable belum lengkap di local demo, aplikasi fallback ke `.makmur-storage` untuk objek privat yang memang perlu disimpan.

```text
CLOUDFLARE_R2_ACCOUNT_ID
CLOUDFLARE_R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_BUCKET
CLOUDFLARE_R2_PUBLIC_URL
CLOUDFLARE_R2_ENDPOINT
```

`CLOUDFLARE_R2_ENDPOINT` dapat diisi endpoint S3-compatible R2, misalnya `https://<account-id>.r2.cloudflarestorage.com`. Jika kosong, aplikasi membentuk endpoint dari `CLOUDFLARE_R2_ACCOUNT_ID`.

## Modul 2-5

Schema source sudah menyiapkan tabel untuk dashboard, katalog obat, batch stok, order, resep, pembayaran, notifikasi, report, import, job, dan error log.
Migration SQL belum digenerate atau diaplikasikan karena membutuhkan persetujuan eksplisit sesuai `@AGENTS.md`.
