import { z } from "zod";

import {
  ERROR_SEVERITY_VALUES,
  JOB_STATUS_VALUES,
  MEDICINE_STATUS_VALUES,
  ORDER_STATUS_VALUES,
  PAYMENT_STATUS_VALUES,
  PRESCRIPTION_STATUS_VALUES,
} from "@/constants/domain";
import { PASSWORD_STRENGTH_SCHEMA } from "@/utils/passwordPolicy";

const EMAIL_SCHEMA = z
  .string()
  .trim()
  .min(1, "Email wajib diisi.")
  .email("Email tidak valid.");

const FULL_NAME_SCHEMA = z
  .string()
  .trim()
  .min(3, "Nama lengkap minimal 3 karakter.")
  .max(120, "Nama lengkap maksimal 120 karakter.");

const PHONE_SCHEMA = z
  .string()
  .trim()
  .min(8, "Nomor telepon minimal 8 digit.")
  .max(20, "Nomor telepon maksimal 20 karakter.")
  .regex(/^[+0-9][0-9\s-]*$/, "Nomor telepon tidak valid.");

/**
 * Auth request schemas.
 */
export class Auth {
  static login = z.object({
    email: EMAIL_SCHEMA,
    password: z
      .string()
      .min(1, "Password wajib diisi.")
      .max(128, "Password maksimal 128 karakter."),
    redirectTo: z.string().optional(),
  });

  static register = z
    .object({
      confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
      email: EMAIL_SCHEMA,
      fullName: FULL_NAME_SCHEMA,
      password: PASSWORD_STRENGTH_SCHEMA,
      phone: PHONE_SCHEMA,
      termsAccepted: z.literal(true, {
        error: "Persetujuan syarat dan kebijakan privasi wajib dicentang.",
      }),
    })
    .refine((value) => value.password === value.confirmPassword, {
      message: "Konfirmasi password tidak sama.",
      path: ["confirmPassword"],
    });

  static verifyEmail = z.object({
    token: z
      .string()
      .trim()
      .min(32, "Token verifikasi tidak valid.")
      .max(256, "Token verifikasi tidak valid."),
  });

  static resendVerification = z.object({
    email: EMAIL_SCHEMA,
  });
}

const ISO_DATE_TEXT_SCHEMA = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus memakai format YYYY-MM-DD.");

const UUID_SCHEMA = z.string().uuid("ID tidak valid.");
const OPTIONAL_UUID_SCHEMA = z
  .string()
  .uuid("ID tidak valid.")
  .nullish()
  .transform((value) => value ?? null);
const CODE_SCHEMA = z
  .string()
  .trim()
  .min(2, "Kode minimal 2 karakter.")
  .max(40, "Kode maksimal 40 karakter.")
  .regex(/^[A-Z0-9][A-Z0-9-]*$/i, "Kode hanya boleh berisi huruf, angka, dan tanda hubung.");
const SLUG_SCHEMA = z
  .string()
  .trim()
  .min(2, "Slug minimal 2 karakter.")
  .max(100, "Slug maksimal 100 karakter.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug harus memakai huruf kecil, angka, dan tanda hubung.");
const MONEY_TEXT_SCHEMA = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), {
    message: "Nilai uang harus berupa angka non-negatif dengan maksimal 2 desimal.",
  });
const POSITIVE_INT_SCHEMA = z
  .number()
  .int("Jumlah harus bilangan bulat.")
  .positive("Jumlah wajib lebih dari 0.");
const NON_NEGATIVE_INT_SCHEMA = z
  .number()
  .int("Angka harus bilangan bulat.")
  .min(0, "Angka tidak boleh negatif.");
const OPTIONAL_TEXT_SCHEMA = z
  .string()
  .trim()
  .max(500, "Teks maksimal 500 karakter.")
  .optional()
  .transform((value) => (value?.length ? value : null));

const atLeastOneField = (value: Record<string, unknown>) =>
  Object.values(value).some((fieldValue) => fieldValue !== undefined);

/**
 * Dashboard request schemas.
 */
export class Dashboard {
  static overviewQuery = z.object({
    from: ISO_DATE_TEXT_SCHEMA.optional(),
    to: ISO_DATE_TEXT_SCHEMA.optional(),
  });
}

/**
 * Master-data schemas for medicines, categories, suppliers, and customers.
 */
export class MasterData {
  static idParams = z.object({
    id: UUID_SCHEMA,
  });

  static categoryCreate = z.object({
    code: CODE_SCHEMA,
    description: OPTIONAL_TEXT_SCHEMA,
    isActive: z.boolean().optional(),
    name: z
      .string()
      .trim()
      .min(2, "Nama kategori minimal 2 karakter.")
      .max(120, "Nama kategori maksimal 120 karakter."),
    slug: SLUG_SCHEMA.optional(),
  });

  static categoryUpdate = MasterData.categoryCreate
    .partial()
    .refine(atLeastOneField, "Minimal satu field kategori wajib diubah.");

  static supplierCreate = z.object({
    address: z
      .string()
      .trim()
      .max(500, "Alamat maksimal 500 karakter.")
      .optional()
      .transform((value) => (value?.length ? value : null)),
    code: CODE_SCHEMA,
    contactName: z
      .string()
      .trim()
      .max(120, "Nama kontak maksimal 120 karakter.")
      .optional()
      .transform((value) => (value?.length ? value : null)),
    email: z
      .string()
      .trim()
      .email("Email supplier tidak valid.")
      .optional()
      .or(z.literal(""))
      .transform((value) => (value ? value : null)),
    isActive: z.boolean().optional(),
    name: z
      .string()
      .trim()
      .min(2, "Nama supplier minimal 2 karakter.")
      .max(160, "Nama supplier maksimal 160 karakter."),
    phone: z
      .string()
      .trim()
      .max(30, "Nomor telepon maksimal 30 karakter.")
      .optional()
      .transform((value) => (value?.length ? value : null)),
  });

  static supplierUpdate = MasterData.supplierCreate
    .partial()
    .refine(atLeastOneField, "Minimal satu field supplier wajib diubah.");

  static medicineBase = z.object({
    categoryId: OPTIONAL_UUID_SCHEMA,
    code: CODE_SCHEMA,
    criticalStockThreshold: NON_NEGATIVE_INT_SCHEMA.default(3),
    description: OPTIONAL_TEXT_SCHEMA,
    lowStockThreshold: NON_NEGATIVE_INT_SCHEMA.default(10),
    name: z
      .string()
      .trim()
      .min(2, "Nama obat minimal 2 karakter.")
      .max(180, "Nama obat maksimal 180 karakter."),
    prescriptionRequired: z.boolean().default(false),
    sellingPrice: MONEY_TEXT_SCHEMA,
    slug: SLUG_SCHEMA.optional(),
    status: z.enum(MEDICINE_STATUS_VALUES).default("ACTIVE"),
    unit: z
      .string()
      .trim()
      .min(1, "Satuan wajib diisi.")
      .max(40, "Satuan maksimal 40 karakter.")
      .default("unit"),
  });

  static medicineCreate = MasterData.medicineBase.refine(
    (value) => value.criticalStockThreshold <= value.lowStockThreshold,
    {
      message: "Batas kritis tidak boleh lebih besar dari batas stok rendah.",
      path: ["criticalStockThreshold"],
    },
  );

  static medicineUpdate = MasterData.medicineBase
    .partial()
    .refine(atLeastOneField, "Minimal satu field obat wajib diubah.")
    .refine(
      (value) =>
        value.criticalStockThreshold === undefined ||
        value.lowStockThreshold === undefined ||
        value.criticalStockThreshold <= value.lowStockThreshold,
      {
        message: "Batas kritis tidak boleh lebih besar dari batas stok rendah.",
        path: ["criticalStockThreshold"],
      },
    );
}

/**
 * Cart and checkout request schemas.
 */
export class Cart {
  static addItem = z.object({
    medicineId: UUID_SCHEMA,
    quantity: POSITIVE_INT_SCHEMA,
  });

  static updateItem = z.object({
    quantity: POSITIVE_INT_SCHEMA,
  });

  static itemParams = z.object({
    itemId: UUID_SCHEMA,
  });

  static checkout = z.object({
    fulfillmentMethod: z.enum(["PICKUP", "DELIVERY"]).default("PICKUP"),
    idempotencyKey: z
      .string()
      .trim()
      .min(8, "Idempotency key minimal 8 karakter.")
      .max(120, "Idempotency key maksimal 120 karakter."),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "QRIS"]),
  });
}

/**
 * Order and payment workflow schemas.
 */
export class Orders {
  static transition = z.object({
    nextStatus: z.enum(ORDER_STATUS_VALUES),
    note: z
      .string()
      .trim()
      .max(500, "Catatan maksimal 500 karakter.")
      .optional(),
  });
}

/**
 * Prescription review filters and mutation schemas.
 */
export class Prescriptions {
  static status = z.enum(PRESCRIPTION_STATUS_VALUES);

  static review = z
    .object({
      approvedItems: z
        .array(
          z.object({
            medicineId: UUID_SCHEMA,
            quantity: POSITIVE_INT_SCHEMA,
          }),
        )
        .default([]),
      decision: z.enum(["APPROVED", "REJECTED", "NEEDS_REVISION"]),
      notes: z
        .string()
        .trim()
        .max(1000, "Catatan maksimal 1000 karakter.")
        .optional()
        .transform((value) => value ?? ""),
    })
    .refine(
      (value) =>
        value.decision === "APPROVED" || value.notes.trim().length >= 5,
      {
        message: "Catatan minimal 5 karakter untuk resep ditolak atau perlu perbaikan.",
        path: ["notes"],
      },
    );
}

/**
 * Payment status filters and callback schemas.
 */
export class Payments {
  static status = z.enum(PAYMENT_STATUS_VALUES);
}

/**
 * Notification mutation schemas.
 */
export class Notifications {
  static markReadParams = z.object({
    id: UUID_SCHEMA,
  });

  static scanAlerts = z.object({
    expiryWindows: z.array(z.enum(["30", "60", "90"])).default(["30", "60", "90"]),
    includeExpiry: z.boolean().default(true),
    includeLowStock: z.boolean().default(true),
  });
}

/**
 * Report request schemas.
 */
export class Reports {
  static request = z.object({
    filters: z.record(z.string(), z.unknown()).default({}),
    type: z
      .string()
      .trim()
      .min(1, "Jenis laporan wajib diisi.")
      .max(80, "Jenis laporan maksimal 80 karakter."),
  });
}

/**
 * Import request schemas.
 */
export class Imports {
  static request = z.object({
    fileSizeBytes: z
      .number()
      .int("Ukuran file tidak valid.")
      .positive("Ukuran file wajib lebih dari 0."),
    mapping: z.record(z.string(), z.string()).default({}),
    originalFileName: z
      .string()
      .trim()
      .min(1, "Nama file wajib diisi.")
      .max(255, "Nama file maksimal 255 karakter."),
    sourceFileObjectKey: z
      .string()
      .trim()
      .min(1, "Object key file wajib diisi.")
      .max(500, "Object key file maksimal 500 karakter."),
    type: z.string().trim().max(40).optional(),
  });
}

/**
 * Application error log mutation schemas.
 */
export class ErrorLogs {
  static record = z.object({
    correlationId: z.string().trim().max(120).optional(),
    diagnosticDetail: z.string().trim().max(4000).optional(),
    safeMessage: z
      .string()
      .trim()
      .min(5, "Pesan aman minimal 5 karakter.")
      .max(500, "Pesan aman maksimal 500 karakter."),
    severity: z.enum(ERROR_SEVERITY_VALUES),
    source: z
      .string()
      .trim()
      .min(2, "Sumber error wajib diisi.")
      .max(120, "Sumber error maksimal 120 karakter."),
  });

  static resolution = z.object({
    note: z
      .string()
      .trim()
      .min(5, "Catatan penyelesaian minimal 5 karakter.")
      .max(500, "Catatan penyelesaian maksimal 500 karakter."),
  });
}

/**
 * Job query schemas.
 */
export class Jobs {
  static status = z.enum(JOB_STATUS_VALUES);
}

export type CartAddItemInput = z.infer<typeof Cart.addItem>;
export type CartCheckoutInput = z.infer<typeof Cart.checkout>;
export type CartUpdateItemInput = z.infer<typeof Cart.updateItem>;
export type LoginInput = z.infer<typeof Auth.login>;
export type RegisterInput = z.infer<typeof Auth.register>;
export type ResendVerificationInput = z.infer<
  typeof Auth.resendVerification
>;
export type VerifyEmailInput = z.infer<typeof Auth.verifyEmail>;
export type ImportRequestInput = z.infer<typeof Imports.request>;
export type CategoryCreateInput = z.infer<typeof MasterData.categoryCreate>;
export type CategoryUpdateInput = z.infer<typeof MasterData.categoryUpdate>;
export type ErrorLogRecordInput = z.infer<typeof ErrorLogs.record>;
export type ErrorLogResolutionInput = z.infer<typeof ErrorLogs.resolution>;
export type MedicineCreateInput = z.infer<typeof MasterData.medicineCreate>;
export type MedicineUpdateInput = z.infer<typeof MasterData.medicineUpdate>;
export type NotificationScanAlertsInput = z.infer<typeof Notifications.scanAlerts>;
export type OrderTransitionInput = z.infer<typeof Orders.transition>;
export type PrescriptionReviewInput = z.infer<typeof Prescriptions.review>;
export type ReportRequestInput = z.infer<typeof Reports.request>;
export type SupplierCreateInput = z.infer<typeof MasterData.supplierCreate>;
export type SupplierUpdateInput = z.infer<typeof MasterData.supplierUpdate>;
