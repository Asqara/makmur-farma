/**
 * Internal Makmur Farma role values.
 */
export const USER_ROLE_VALUES = [
  "ADMIN",
  "PHARMACIST",
  "CASHIER",
  "CUSTOMER",
] as const;

/**
 * User account lifecycle status values.
 */
export const USER_STATUS_VALUES = [
  "ACTIVE",
  "PENDING_VERIFICATION",
  "SUSPENDED",
  "DISABLED",
] as const;

/**
 * Permission values used by Makmur Farma.
 */
export const PERMISSION_VALUES = [
  "dashboard.read",
  "medicine.read",
  "medicine.write",
  "medicine.delete",
  "category.read",
  "category.write",
  "supplier.read",
  "supplier.write",
  "batch.read",
  "batch.write",
  "stock_movement.read",
  "stock_adjustment.write",
  "order.read",
  "order.write",
  "order.process",
  "order.cancel",
  "prescription.read",
  "prescription.verify",
  "payment.read",
  "payment.process",
  "customer.read",
  "customer.write",
  "import.read",
  "import.run",
  "report.read",
  "report.generate",
  "notification.read",
  "audit_log.read",
  "error_log.read",
  "monitoring.read",
  "user.read",
  "user.write",
  "settings.read",
  "settings.write",
] as const;

/**
 * User role union.
 */
export type UserRole = (typeof USER_ROLE_VALUES)[number];

/**
 * User status union.
 */
export type UserStatus = (typeof USER_STATUS_VALUES)[number];

/**
 * Permission union.
 */
export type Permission = (typeof PERMISSION_VALUES)[number];

/**
 * Operational staff roles that may enter the dashboard shell.
 */
export const OPERATIONAL_ROLE_VALUES: readonly UserRole[] = [
  "ADMIN",
  "PHARMACIST",
  "CASHIER",
];

/**
 * Role labels shown in Bahasa Indonesia.
 */
export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  PHARMACIST: "Apoteker",
  CASHIER: "Kasir",
  CUSTOMER: "Pasien/Pelanggan",
};

/**
 * User status labels shown in Bahasa Indonesia.
 */
export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: "Aktif",
  PENDING_VERIFICATION: "Menunggu Verifikasi Email",
  SUSPENDED: "Ditangguhkan",
  DISABLED: "Dinonaktifkan",
};

/**
 * Permission labels shown in admin screens.
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "dashboard.read": "Lihat Dashboard",
  "medicine.read": "Lihat Obat",
  "medicine.write": "Kelola Obat",
  "medicine.delete": "Hapus Obat",
  "category.read": "Lihat Kategori",
  "category.write": "Kelola Kategori",
  "supplier.read": "Lihat Supplier",
  "supplier.write": "Kelola Supplier",
  "batch.read": "Lihat Batch Stok",
  "batch.write": "Kelola Batch Stok",
  "stock_movement.read": "Lihat Pergerakan Stok",
  "stock_adjustment.write": "Penyesuaian Stok",
  "order.read": "Lihat Pesanan",
  "order.write": "Buat Pesanan",
  "order.process": "Proses Pesanan",
  "order.cancel": "Batalkan Pesanan",
  "prescription.read": "Lihat Resep",
  "prescription.verify": "Verifikasi Resep",
  "payment.read": "Lihat Pembayaran",
  "payment.process": "Proses Pembayaran",
  "customer.read": "Lihat Pelanggan",
  "customer.write": "Kelola Pelanggan",
  "import.read": "Lihat Import",
  "import.run": "Jalankan Import",
  "report.read": "Lihat Laporan",
  "report.generate": "Buat Laporan",
  "notification.read": "Lihat Notifikasi",
  "audit_log.read": "Lihat Audit Log",
  "error_log.read": "Lihat Error Log",
  "monitoring.read": "Lihat Monitoring",
  "user.read": "Lihat Pengguna",
  "user.write": "Kelola Pengguna",
  "settings.read": "Lihat Pengaturan",
  "settings.write": "Kelola Pengaturan",
};

/**
 * Permission mapping per MVP role.
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  ADMIN: PERMISSION_VALUES,
  PHARMACIST: [
    "dashboard.read",
    "medicine.read",
    "medicine.write",
    "category.read",
    "supplier.read",
    "batch.read",
    "batch.write",
    "stock_movement.read",
    "order.read",
    "order.process",
    "prescription.read",
    "prescription.verify",
    "notification.read",
    "report.read",
  ],
  CASHIER: [
    "dashboard.read",
    "medicine.read",
    "category.read",
    "batch.read",
    "stock_movement.read",
    "order.read",
    "order.write",
    "order.process",
    "payment.read",
    "payment.process",
    "customer.read",
    "customer.write",
    "notification.read",
  ],
  CUSTOMER: [],
};

/**
 * Role-based login destinations.
 */
export const ROLE_DEFAULT_REDIRECTS: Record<UserRole, string> = {
  ADMIN: "/dashboard",
  PHARMACIST: "/dashboard",
  CASHIER: "/dashboard",
  CUSTOMER: "/account",
};

/**
 * Audit action names used by security-sensitive flows.
 */
export const AUDIT_ACTIONS = {
  AUTH_ACCESS_DENIED: "AUTH_ACCESS_DENIED",
  AUTH_EMAIL_VERIFICATION_FAILED: "AUTH_EMAIL_VERIFICATION_FAILED",
  AUTH_EMAIL_VERIFICATION_RESENT: "AUTH_EMAIL_VERIFICATION_RESENT",
  AUTH_EMAIL_VERIFICATION_SENT: "AUTH_EMAIL_VERIFICATION_SENT",
  AUTH_EMAIL_VERIFIED: "AUTH_EMAIL_VERIFIED",
  AUTH_LOGIN_BLOCKED: "AUTH_LOGIN_BLOCKED",
  AUTH_LOGIN_FAILED: "AUTH_LOGIN_FAILED",
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGOUT: "AUTH_LOGOUT",
  AUTH_REGISTER_FAILED: "AUTH_REGISTER_FAILED",
  AUTH_REGISTER_SUCCESS: "AUTH_REGISTER_SUCCESS",
  AUTH_SESSION_CREATED: "AUTH_SESSION_CREATED",
  AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED",
  AUTH_SESSION_REVOKED: "AUTH_SESSION_REVOKED",
  USER_CREATED: "USER_CREATED",
  USER_UPDATED: "USER_UPDATED",
  USER_DELETED: "USER_DELETED",
  MEDICINE_CREATED: "MEDICINE_CREATED",
  MEDICINE_UPDATED: "MEDICINE_UPDATED",
  MEDICINE_DELETED: "MEDICINE_DELETED",
  BATCH_CREATED: "BATCH_CREATED",
  STOCK_ADJUSTED: "STOCK_ADJUSTED",
  PRESCRIPTION_REVIEWED: "PRESCRIPTION_REVIEWED",
  ORDER_STATUS_CHANGED: "ORDER_STATUS_CHANGED",
  PAYMENT_CONFIRMED: "PAYMENT_CONFIRMED",
  IMPORT_RUN: "IMPORT_RUN",
  REPORT_GENERATED: "REPORT_GENERATED",
  SETTINGS_CHANGED: "SETTINGS_CHANGED",
} as const;

/**
 * Audit result values.
 */
export const AUDIT_RESULT_VALUES = ["SUCCESS", "FAILED", "BLOCKED"] as const;

/**
 * Session idle timeout in seconds (30 minutes).
 */
export const SESSION_IDLE_TIMEOUT_SECONDS = 30 * 60;

/**
 * Session absolute timeout in seconds (12 hours).
 */
export const SESSION_ABSOLUTE_TIMEOUT_SECONDS = 12 * 60 * 60;

/**
 * Email verification token lifetime in seconds (60 minutes).
 */
export const EMAIL_VERIFICATION_TTL_SECONDS = 60 * 60;

/**
 * Last activity updates are throttled to avoid a write on every request.
 */
export const SESSION_ACTIVITY_UPDATE_THROTTLE_SECONDS = 5 * 60;

/**
 * Login rate limit attempts per window.
 */
export const AUTH_LOGIN_RATE_LIMIT_ATTEMPTS = 10;

/**
 * Login rate limit window in seconds (5 minutes).
 */
export const AUTH_LOGIN_RATE_LIMIT_WINDOW_SECONDS = 5 * 60;

/**
 * Registration rate limit attempts per window.
 */
export const AUTH_REGISTER_RATE_LIMIT_ATTEMPTS = 5;

/**
 * Registration rate limit window in seconds (10 minutes).
 */
export const AUTH_REGISTER_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

/**
 * Verification and resend attempts per window.
 */
export const AUTH_VERIFICATION_RATE_LIMIT_ATTEMPTS = 5;

/**
 * Verification and resend window in seconds (10 minutes).
 */
export const AUTH_VERIFICATION_RATE_LIMIT_WINDOW_SECONDS = 10 * 60;

/**
 * Login rate limit key prefix.
 */
export const AUTH_LOGIN_RATE_LIMIT_KEY_PREFIX = "auth-login";

/**
 * Registration rate limit key prefix.
 */
export const AUTH_REGISTER_RATE_LIMIT_KEY_PREFIX = "auth-register";

/**
 * Verification rate limit key prefix.
 */
export const AUTH_VERIFICATION_RATE_LIMIT_KEY_PREFIX = "auth-verification";

/**
 * Resend verification rate limit key prefix.
 */
export const AUTH_RESEND_VERIFICATION_RATE_LIMIT_KEY_PREFIX =
  "auth-resend-verification";

/**
 * Fallback IP label for missing request IP.
 */
export const AUTH_RATE_LIMIT_UNKNOWN_IP = "unknown";

/**
 * CSRF header required on authenticated mutation requests.
 */
export const CSRF_HEADER_NAME = "x-csrf-token";

/**
 * Demo password for local seed users only.
 */
export const DEMO_USER_PASSWORD = "Demo#12345";

/**
 * Argon2id password hash options shared by auth and seed flows.
 */
export const PASSWORD_HASH_OPTIONS = {
  algorithm: 2,
  memoryCost: 19_456,
  outputLen: 32,
  parallelism: 1,
  timeCost: 2,
} as const;
