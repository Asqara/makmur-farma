import { hash } from "@node-rs/argon2";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  DEMO_USER_PASSWORD,
  PASSWORD_HASH_OPTIONS,
  type UserRole,
} from "@/constants/auth";
import { ENV } from "@/constants/config";
import * as schema from "@/drizzle-schema";
import {
  applicationErrors,
  importRuns,
  jobRuns,
  medicineBatches,
  medicineCategories,
  medicines,
  notifications,
  orderItems,
  orders,
  payments,
  prescriptions,
  reportRuns,
  stockMovements,
  suppliers,
  users,
} from "@/drizzle-schema";
import { validatePasswordStrength } from "@/utils/passwordPolicy";

const DEMO_USERS: Array<{
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
}> = [
  {
    email: "admin@makmur-farma.test",
    fullName: "Admin Makmur",
    phone: "081100000001",
    role: "ADMIN",
  },
  {
    email: "apoteker@makmur-farma.test",
    fullName: "Apt. Sari Makmur",
    phone: "081100000002",
    role: "PHARMACIST",
  },
  {
    email: "kasir@makmur-farma.test",
    fullName: "Dewi Kasir",
    phone: "081100000003",
    role: "CASHIER",
  },
  {
    email: "pelanggan@makmur-farma.test",
    fullName: "Budi Pelanggan",
    phone: "081100000004",
    role: "CUSTOMER",
  },
];

async function seed() {
  const passwordValidation = validatePasswordStrength(DEMO_USER_PASSWORD);

  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.messages.join(" "));
  }

  const passwordHash = await hash(DEMO_USER_PASSWORD, PASSWORD_HASH_OPTIONS);
  const now = new Date();
  const client = postgres(ENV.databaseUrl, {
    max: 1,
    prepare: false,
  });
  const db = drizzle(client, { schema });

  try {
    const userIds: Partial<Record<UserRole, string>> = {};

    for (const user of DEMO_USERS) {
      const normalizedEmail = user.email.toLowerCase();

      const [row] = await db
        .insert(users)
        .values({
          email: user.email,
          emailVerifiedAt: now,
          fullName: user.fullName,
          isActive: true,
          normalizedEmail,
          passwordHash,
          phone: user.phone,
          role: user.role,
          status: "ACTIVE",
        })
        .onConflictDoUpdate({
          set: {
            emailVerifiedAt: now,
            fullName: user.fullName,
            isActive: true,
            passwordHash,
            phone: user.phone,
            role: user.role,
            status: "ACTIVE",
            updatedAt: now,
          },
          target: users.normalizedEmail,
        })
        .returning({ id: users.id, role: users.role });

      userIds[row.role] = row.id;
    }

    const [categoryAnalgesic] = await db
      .insert(medicineCategories)
      .values({
        code: "KAT-ANALGESIK",
        description: "Data demo kategori obat nyeri dan demam.",
        name: "Analgesik",
        slug: "analgesik",
      })
      .onConflictDoUpdate({
        set: {
          description: "Data demo kategori obat nyeri dan demam.",
          name: "Analgesik",
          updatedAt: now,
        },
        target: medicineCategories.code,
      })
      .returning();

    const [categoryAntibiotic] = await db
      .insert(medicineCategories)
      .values({
        code: "KAT-ANTIBIOTIK",
        description: "Data demo kategori obat yang memerlukan resep.",
        name: "Antibiotik",
        slug: "antibiotik",
      })
      .onConflictDoUpdate({
        set: {
          description: "Data demo kategori obat yang memerlukan resep.",
          name: "Antibiotik",
          updatedAt: now,
        },
        target: medicineCategories.code,
      })
      .returning();

    const [supplier] = await db
      .insert(suppliers)
      .values({
        code: "SUP-SEHAT",
        contactName: "Kontak Demo",
        email: "supplier@example.test",
        name: "PT Sehat Sentosa Demo",
        phone: "081199990001",
      })
      .onConflictDoUpdate({
        set: {
          contactName: "Kontak Demo",
          email: "supplier@example.test",
          name: "PT Sehat Sentosa Demo",
          phone: "081199990001",
          updatedAt: now,
        },
        target: suppliers.code,
      })
      .returning();

    const [paracetamol] = await db
      .insert(medicines)
      .values({
        categoryId: categoryAnalgesic.id,
        code: "OBT-PCT-500",
        criticalStockThreshold: 10,
        description: "Data demo produk. Informasi klinis mengikuti resep dan arahan tenaga kesehatan.",
        lowStockThreshold: 30,
        name: "Paracetamol Demo 500 mg",
        prescriptionRequired: false,
        sellingPrice: "8000.00",
        slug: "paracetamol-demo-500",
        status: "ACTIVE",
        unit: "tablet",
      })
      .onConflictDoUpdate({
        set: {
          categoryId: categoryAnalgesic.id,
          lowStockThreshold: 30,
          name: "Paracetamol Demo 500 mg",
          sellingPrice: "8000.00",
          status: "ACTIVE",
          updatedAt: now,
        },
        target: medicines.code,
      })
      .returning();

    const [amoxicillin] = await db
      .insert(medicines)
      .values({
        categoryId: categoryAntibiotic.id,
        code: "OBT-AMX-DEMO",
        criticalStockThreshold: 5,
        description: "Data demo obat resep. Pembelian wajib melalui verifikasi apoteker.",
        lowStockThreshold: 15,
        name: "Amoxicillin Demo",
        prescriptionRequired: true,
        sellingPrice: "18000.00",
        slug: "amoxicillin-demo",
        status: "ACTIVE",
        unit: "kapsul",
      })
      .onConflictDoUpdate({
        set: {
          categoryId: categoryAntibiotic.id,
          lowStockThreshold: 15,
          name: "Amoxicillin Demo",
          prescriptionRequired: true,
          sellingPrice: "18000.00",
          status: "ACTIVE",
          updatedAt: now,
        },
        target: medicines.code,
      })
      .returning();

    const [batchNormal] = await db
      .insert(medicineBatches)
      .values({
        availableQuantity: 120,
        batchNumber: "BATCH-PCT-260601",
        expiryDate: new Date("2026-09-20"),
        medicineId: paracetamol.id,
        purchaseCost: "4500.00",
        receivedDate: new Date("2026-06-01"),
        reservedQuantity: 0,
        status: "AVAILABLE",
        supplierId: supplier.id,
      })
      .onConflictDoUpdate({
        set: {
          availableQuantity: 120,
          expiryDate: new Date("2026-09-20"),
          reservedQuantity: 0,
          status: "AVAILABLE",
          updatedAt: now,
        },
        target: [medicineBatches.medicineId, medicineBatches.batchNumber],
      })
      .returning();

    const [batchLow] = await db
      .insert(medicineBatches)
      .values({
        availableQuantity: 8,
        batchNumber: "BATCH-AMX-260530",
        expiryDate: new Date("2026-07-05"),
        medicineId: amoxicillin.id,
        purchaseCost: "12000.00",
        receivedDate: new Date("2026-05-30"),
        reservedQuantity: 2,
        status: "AVAILABLE",
        supplierId: supplier.id,
      })
      .onConflictDoUpdate({
        set: {
          availableQuantity: 8,
          expiryDate: new Date("2026-07-05"),
          reservedQuantity: 2,
          status: "AVAILABLE",
          updatedAt: now,
        },
        target: [medicineBatches.medicineId, medicineBatches.batchNumber],
      })
      .returning();

    await db.insert(stockMovements).values([
      {
        actorUserId: userIds.ADMIN,
        availableAfter: 120,
        availableBefore: 0,
        batchId: batchNormal.id,
        medicineId: paracetamol.id,
        quantityDelta: 120,
        reason: "Demo opening stock.",
        referenceId: "seed",
        referenceType: "seed",
        reservedAfter: 0,
        reservedBefore: 0,
        type: "IMPORT_OPENING",
      },
      {
        actorUserId: userIds.ADMIN,
        availableAfter: 8,
        availableBefore: 0,
        batchId: batchLow.id,
        medicineId: amoxicillin.id,
        quantityDelta: 10,
        reason: "Demo opening stock with reserved quantity.",
        referenceId: "seed",
        referenceType: "seed",
        reservedAfter: 2,
        reservedBefore: 0,
        type: "IMPORT_OPENING",
      },
    ]);

    const [order] = await db
      .insert(orders)
      .values({
        channel: "ONLINE",
        customerUserId: userIds.CUSTOMER,
        grandTotal: "18000.00",
        orderNumber: "ORD-20260605-0001",
        prescriptionRequired: true,
        status: "PRESCRIPTION_REVIEW",
        subtotal: "18000.00",
      })
      .onConflictDoUpdate({
        set: {
          grandTotal: "18000.00",
          prescriptionRequired: true,
          status: "PRESCRIPTION_REVIEW",
          subtotal: "18000.00",
          updatedAt: now,
        },
        target: orders.orderNumber,
      })
      .returning();

    await db
      .insert(orderItems)
      .values({
        medicineId: amoxicillin.id,
        orderId: order.id,
        prescriptionRequired: true,
        quantity: 1,
        subtotal: "18000.00",
        unitPrice: "18000.00",
      })
      .onConflictDoNothing();

    await db
      .insert(prescriptions)
      .values({
        contentType: "application/pdf",
        customerUserId: userIds.CUSTOMER!,
        orderId: order.id,
        originalFileName: "resep-demo.pdf",
        originalObjectKey: "private/prescriptions/demo/resep-demo.pdf",
        sizeBytes: 128000,
        status: "PENDING",
      })
      .onConflictDoNothing();

    await db
      .insert(payments)
      .values({
        amount: "18000.00",
        idempotencyKey: "seed-payment-ord-0001",
        method: "BANK_TRANSFER",
        orderId: order.id,
        provider: "manual",
        providerReference: "PAY-DEMO-0001",
        status: "PENDING",
      })
      .onConflictDoUpdate({
        set: {
          amount: "18000.00",
          status: "PENDING",
          updatedAt: now,
        },
        target: payments.idempotencyKey,
      });

    await db
      .insert(notifications)
      .values({
        actionHref: "/prescriptions",
        dedupeKey: "seed:prescription-review",
        message: "Ada resep demo yang menunggu verifikasi apoteker.",
        roleTarget: "PHARMACIST",
        severity: "warning",
        title: "Resep Menunggu Verifikasi",
        type: "PRESCRIPTION_REVIEW",
      })
      .onConflictDoUpdate({
        set: {
          isRead: false,
          message: "Ada resep demo yang menunggu verifikasi apoteker.",
          updatedAt: now,
        },
        target: notifications.dedupeKey,
      });

    await db
      .insert(reportRuns)
      .values({
        fileSizeBytes: 24576,
        filename: "laporan-penjualan-demo.pdf",
        filters: {
          from: "2026-06-01",
          to: "2026-06-05",
        },
        progress: 100,
        requesterUserId: userIds.ADMIN,
        status: "COMPLETED",
        type: "sales_summary",
      })
      .onConflictDoNothing();

    await db
      .insert(importRuns)
      .values({
        failedRows: 1,
        fileSizeBytes: 20480,
        mapping: {
          code: "Kode",
          name: "Nama",
        },
        originalFileName: "import-obat-demo.xlsx",
        processedRows: 10,
        requesterUserId: userIds.ADMIN,
        sourceFileObjectKey: "private/imports/demo/import-obat-demo.xlsx",
        status: "PARTIALLY_COMPLETED",
        totalRows: 10,
        type: "MEDICINE",
        validRows: 9,
      })
      .onConflictDoNothing();

    await db
      .insert(jobRuns)
      .values({
        completedAt: now,
        entityId: "seed",
        entityType: "report",
        jobKey: "seed-report-generation",
        jobType: "REPORT_GENERATION",
        maxAttempts: 3,
        progress: 100,
        queueName: "reports",
        status: "COMPLETED",
      })
      .onConflictDoUpdate({
        set: {
          completedAt: now,
          progress: 100,
          status: "COMPLETED",
          updatedAt: now,
        },
        target: jobRuns.jobKey,
      });

    await db
      .insert(applicationErrors)
      .values({
        correlationId: "demo-correlation",
        safeMessage: "Contoh error warning untuk dashboard monitoring.",
        severity: "warning",
        source: "seed",
      })
      .onConflictDoNothing();
  } finally {
    await client.end({ timeout: 5 });
  }
}

seed()
  .then(() => {
    console.info(
      `Seed selesai. Password demo: ${DEMO_USER_PASSWORD}. Gunakan hanya untuk development.`,
    );
  })
  .catch((error) => {
    console.error("Seed gagal.", error);
    process.exitCode = 1;
  });
