import "server-only";

/**
 * Base application error that is safe to serialize.
 */
export class AppError extends Error {
  code: string;
  publicMessage: string;
  statusCode: number;

  constructor(statusCode: number, code: string, publicMessage: string) {
    super(publicMessage);
    this.code = code;
    this.publicMessage = publicMessage;
    this.statusCode = statusCode;
  }
}

/**
 * Error for invalid server configuration.
 */
export class ConfigurationError extends AppError {
  constructor(publicMessage = "Konfigurasi server belum lengkap.") {
    super(500, "CONFIGURATION_ERROR", publicMessage);
  }
}

/**
 * Error for invalid request data.
 */
export class ValidationAppError extends AppError {
  constructor(publicMessage = "Data yang dikirim tidak valid.") {
    super(400, "VALIDATION_ERROR", publicMessage);
  }
}

/**
 * Error for failed authentication.
 */
export class AuthenticationError extends AppError {
  constructor(publicMessage = "Email atau password salah.") {
    super(401, "AUTHENTICATION_ERROR", publicMessage);
  }
}

/**
 * Error for accounts that still need email verification.
 */
export class EmailNotVerifiedError extends AppError {
  constructor(publicMessage = "Email belum diverifikasi.") {
    super(403, "EMAIL_NOT_VERIFIED", publicMessage);
  }
}

/**
 * Error for missing or expired sessions.
 */
export class UnauthorizedError extends AppError {
  constructor(publicMessage = "Session telah berakhir. Silakan login kembali.") {
    super(401, "UNAUTHORIZED", publicMessage);
  }
}

/**
 * Error for expired session records.
 */
export class SessionExpiredError extends UnauthorizedError {
  constructor(publicMessage = "Sesi Anda telah berakhir. Silakan masuk kembali.") {
    super(publicMessage);
    this.code = "SESSION_EXPIRED";
  }
}

/**
 * Error for inactive user accounts.
 */
export class InactiveAccountError extends AppError {
  constructor(publicMessage = "Akun nonaktif. Hubungi admin untuk bantuan.") {
    super(403, "INACTIVE_ACCOUNT", publicMessage);
  }
}

/**
 * Error for suspended or disabled user accounts.
 */
export class AccountDisabledError extends AppError {
  constructor(publicMessage = "Akun tidak dapat digunakan saat ini.") {
    super(403, "ACCOUNT_DISABLED", publicMessage);
  }
}

/**
 * Error for insufficient permission.
 */
export class ForbiddenError extends AppError {
  constructor(publicMessage = "Anda tidak memiliki akses untuk aksi ini.") {
    super(403, "FORBIDDEN", publicMessage);
  }
}

/**
 * Error for invalid or reused email verification tokens.
 */
export class InvalidVerificationTokenError extends AppError {
  constructor(publicMessage = "Tautan verifikasi tidak valid.") {
    super(400, "INVALID_VERIFICATION_TOKEN", publicMessage);
  }
}

/**
 * Error for expired email verification tokens.
 */
export class VerificationTokenExpiredError extends AppError {
  constructor(publicMessage = "Tautan verifikasi sudah kedaluwarsa.") {
    super(400, "VERIFICATION_TOKEN_EXPIRED", publicMessage);
  }
}

/**
 * Error for unsafe redirect targets.
 */
export class UnsafeRedirectError extends AppError {
  constructor(publicMessage = "Tujuan redirect tidak valid.") {
    super(400, "UNSAFE_REDIRECT", publicMessage);
  }
}

/**
 * Error for missing records.
 */
export class NotFoundAppError extends AppError {
  constructor(publicMessage = "Data tidak ditemukan.") {
    super(404, "NOT_FOUND", publicMessage);
  }
}

/**
 * Error for duplicate records.
 */
export class ConflictAppError extends AppError {
  constructor(publicMessage = "Data sudah digunakan.") {
    super(409, "CONFLICT", publicMessage);
  }
}

/**
 * Error for invalid stock movement quantities.
 */
export class InvalidQuantityError extends AppError {
  constructor(publicMessage = "Jumlah stok tidak valid.") {
    super(400, "INVALID_QUANTITY", publicMessage);
  }
}

/**
 * Error for stock out requests that exceed available stock.
 */
export class InsufficientStockError extends AppError {
  constructor(publicMessage = "Stok tidak mencukupi.") {
    super(409, "INSUFFICIENT_STOCK", publicMessage);
  }
}

/**
 * Error for failed monitoring checks.
 */
export class MonitoringCheckError extends AppError {
  constructor(publicMessage = "Monitoring check gagal.") {
    super(503, "MONITORING_CHECK_FAILED", publicMessage);
  }
}

/**
 * Error for failed email delivery.
 */
export class EmailDeliveryError extends AppError {
  constructor(publicMessage = "Email notifikasi gagal dikirim.") {
    super(502, "EMAIL_DELIVERY_FAILED", publicMessage);
  }
}

/**
 * Error for invalid CSRF token.
 */
export class CsrfError extends AppError {
  constructor(publicMessage = "Token keamanan tidak valid.") {
    super(403, "CSRF_ERROR", publicMessage);
  }
}

/**
 * Error for rate limit exceeded.
 */
export class RateLimitError extends AppError {
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super(
      429,
      "RATE_LIMITED",
      `Terlalu banyak percobaan. Coba lagi dalam ${retryAfterSeconds} detik.`,
    );
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Error for transfer where source and destination warehouse are the same.
 */
export class TransferSameWarehouseError extends AppError {
  constructor(publicMessage = "Gudang asal dan tujuan tidak boleh sama.") {
    super(400, "TRANSFER_SAME_WAREHOUSE", publicMessage);
  }
}

/**
 * Error for import file validation failures.
 */
export class ImportFileError extends AppError {
  constructor(publicMessage = "File import tidak valid.") {
    super(400, "IMPORT_FILE_INVALID", publicMessage);
  }
}

/**
 * Error for job not found or already in terminal state.
 */
export class JobNotFoundError extends AppError {
  constructor(publicMessage = "Job tidak ditemukan.") {
    super(404, "JOB_NOT_FOUND", publicMessage);
  }
}

/**
 * Error for report generation failures.
 */
export class ReportGenerationError extends AppError {
  constructor(publicMessage = "Laporan gagal dibuat.") {
    super(500, "REPORT_GENERATION_FAILED", publicMessage);
  }
}

/**
 * Error for product image upload validation and storage failures.
 */
export class ProductImageUploadError extends AppError {
  constructor(publicMessage = "Gambar produk tidak valid.") {
    super(400, "PRODUCT_IMAGE_UPLOAD_FAILED", publicMessage);
  }
}
