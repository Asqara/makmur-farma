import "server-only";

import { and, asc, desc, eq, gt, gte, lt, lte, ne, notInArray, or, sql } from "drizzle-orm";

import { AUDIT_ACTIONS, type UserRole } from "@/constants/auth";
import type {
  BatchStatus,
  MedicineStatus,
  StockMovementType,
} from "@/constants/domain";
import {
  auditLogs,
  medicineBatches,
  medicineCategories,
  medicineImages,
  medicines,
  orderItems,
  stockMovements,
  suppliers,
  users,
} from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import {
  ConflictAppError,
  InsufficientStockError,
  NotFoundAppError,
  ValidationAppError,
} from "@/lib/errors";
import type { RequestContext } from "@/lib/request";
import type {
  CategoryCreateInput,
  CategoryUpdateInput,
  MedicineCreateInput,
  MedicineUpdateInput,
  StockAdjustmentInput,
  StockReceiptInput,
  SupplierCreateInput,
  SupplierUpdateInput,
} from "@/zod-schemas";

import {
  buildPagination,
  buildTextSearch,
  combineConditions,
  countSql,
  getListFilters,
  toBooleanString,
  toString,
  type ListResponse,
} from "./list-utils";

const MEDICINE_SORT_FIELDS = {
  createdAt: medicines.createdAt,
  name: medicines.name,
  price: medicines.sellingPrice,
} as const;

const CATEGORY_SORT_FIELDS = {
  createdAt: medicineCategories.createdAt,
  name: medicineCategories.name,
} as const;

const SUPPLIER_SORT_FIELDS = {
  createdAt: suppliers.createdAt,
  name: suppliers.name,
} as const;

const BATCH_SORT_FIELDS = {
  createdAt: medicineBatches.createdAt,
  expiryDate: medicineBatches.expiryDate,
  receivedDate: medicineBatches.receivedDate,
} as const;

const MOVEMENT_SORT_FIELDS = {
  createdAt: stockMovements.createdAt,
  type: stockMovements.type,
} as const;

export type MedicineListItem = {
  category: {
    id: string | null;
    name: string | null;
    slug: string | null;
  };
  code: string;
  createdAt: Date;
  criticalStockThreshold: number;
  id: string;
  lowStockThreshold: number;
  name: string;
  prescriptionRequired: boolean;
  primaryImageUrl: string | null;
  sellingPrice: string;
  slug: string;
  status: MedicineStatus;
  totalAvailable: number;
  totalReserved: number;
  unit: string;
};

export type MedicineImageItem = {
  altText: string | null;
  id: string;
  isPrimary: boolean;
  url: string | null;
};

export type MedicineDetail = MedicineListItem & {
  images: MedicineImageItem[];
};

export type CategoryListItem = {
  code: string;
  createdAt: Date;
  description: string | null;
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
};

export type SupplierListItem = {
  address: string | null;
  code: string;
  contactName: string | null;
  createdAt: Date;
  email: string | null;
  id: string;
  isActive: boolean;
  name: string;
  phone: string | null;
};

export type BatchListItem = {
  availableQuantity: number;
  batchNumber: string;
  expiryDate: Date;
  id: string;
  medicine: {
    code: string;
    id: string;
    name: string;
    unit: string;
  };
  purchaseCost: string;
  receivedDate: Date;
  reservedQuantity: number;
  status: BatchStatus;
  supplier: {
    id: string | null;
    name: string | null;
  };
};

export type StockMovementListItem = {
  actor: {
    id: string | null;
    name: string | null;
  };
  availableAfter: number;
  availableBefore: number;
  batchNumber: string;
  createdAt: Date;
  id: string;
  medicine: {
    code: string;
    id: string;
    name: string;
  };
  quantityDelta: number;
  reason: string;
  referenceId: string | null;
  referenceType: string | null;
  type: StockMovementType;
};

type MutationActor = {
  actorRole: UserRole;
  actorUserId: string;
  requestContext: RequestContext;
};

function parseDateFilter(value: string, endOfDay = false) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getSlug(inputSlug: string | undefined, fallbackText: string) {
  const slug = inputSlug?.trim() || toSlug(fallbackText);

  if (!slug) {
    throw new ConflictAppError("Slug tidak dapat dibuat dari nama.");
  }

  return slug;
}

function isUniqueViolation(error: unknown) {
  return (
    error !== null &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: string }).code === "23505"
  );
}

/**
 * Medicine, category, supplier, batch, and movement query service.
 */
export class MedicinesClient {
  private async writeAudit({
    action,
    actorRole,
    actorUserId,
    description,
    metadata,
    requestContext,
    targetId,
    targetType,
  }: MutationActor & {
    action: string;
    description: string;
    metadata?: Record<string, unknown>;
    targetId: string;
    targetType: string;
  }) {
    await db.insert(auditLogs).values({
      action,
      actorRole,
      actorUserId,
      correlationId: requestContext.correlationId,
      description,
      ipAddress: requestContext.ipAddress,
      metadata: metadata ?? {},
      result: "SUCCESS",
      targetId,
      targetType,
      userAgent: requestContext.userAgent,
    });
  }

  private async ensureCategoryUsable(categoryId: string | null) {
    if (!categoryId) return;

    const [category] = await readDb
      .select({
        id: medicineCategories.id,
        isActive: medicineCategories.isActive,
      })
      .from(medicineCategories)
      .where(eq(medicineCategories.id, categoryId))
      .limit(1);

    if (!category || !category.isActive) {
      throw new NotFoundAppError("Kategori obat tidak ditemukan atau nonaktif.");
    }
  }

  async getMedicine(id: string): Promise<MedicineListItem> {
    const result = await this.listMedicines({ id, limit: "1", page: "1" });
    const medicine = result.data.find((item) => item.id === id);

    if (!medicine) {
      throw new NotFoundAppError("Obat tidak ditemukan.");
    }

    return medicine;
  }

  async getMedicineBySlug(slug: string): Promise<MedicineListItem> {
    const result = await this.listMedicines({ slug, limit: "1", page: "1" });
    const medicine = result.data.find((item) => item.slug === slug);

    if (!medicine) {
      throw new NotFoundAppError("Obat tidak ditemukan.");
    }

    return medicine;
  }

  async getMedicineDetailBySlug(slug: string): Promise<MedicineDetail> {
    const medicine = await this.getMedicineBySlug(slug);

    const imageRows = await readDb
      .select({
        altText: medicineImages.altText,
        id: medicineImages.id,
        isPrimary: medicineImages.isPrimary,
        url: medicineImages.publicUrl,
      })
      .from(medicineImages)
      .where(eq(medicineImages.medicineId, medicine.id))
      .orderBy(desc(medicineImages.isPrimary), asc(medicineImages.createdAt));

    return {
      ...medicine,
      images: imageRows.map((row) => ({
        altText: row.altText ?? null,
        id: row.id,
        isPrimary: row.isPrimary,
        url: row.url ?? null,
      })),
    };
  }

  async getCategory(id: string): Promise<CategoryListItem> {
    const [category] = await readDb
      .select()
      .from(medicineCategories)
      .where(eq(medicineCategories.id, id))
      .limit(1);

    if (!category) {
      throw new NotFoundAppError("Kategori obat tidak ditemukan.");
    }

    return {
      code: category.code,
      createdAt: category.createdAt,
      description: category.description ?? null,
      id: category.id,
      isActive: category.isActive,
      name: category.name,
      slug: category.slug,
    };
  }

  async getSupplier(id: string): Promise<SupplierListItem> {
    const [supplier] = await readDb
      .select()
      .from(suppliers)
      .where(eq(suppliers.id, id))
      .limit(1);

    if (!supplier) {
      throw new NotFoundAppError("Supplier tidak ditemukan.");
    }

    return {
      address: supplier.address ?? null,
      code: supplier.code,
      contactName: supplier.contactName ?? null,
      createdAt: supplier.createdAt,
      email: supplier.email ?? null,
      id: supplier.id,
      isActive: supplier.isActive,
      name: supplier.name,
      phone: supplier.phone ?? null,
    };
  }

  async createCategory(
    input: CategoryCreateInput,
    actor: MutationActor,
  ): Promise<CategoryListItem> {
    const code = normalizeCode(input.code);
    const slug = getSlug(input.slug, input.name);

    const [existing] = await readDb
      .select({ id: medicineCategories.id })
      .from(medicineCategories)
      .where(or(eq(medicineCategories.code, code), eq(medicineCategories.slug, slug)))
      .limit(1);

    if (existing) {
      throw new ConflictAppError("Kode atau slug kategori sudah digunakan.");
    }

    try {
      const [category] = await db
        .insert(medicineCategories)
        .values({
          code,
          description: input.description,
          isActive: input.isActive ?? true,
          name: input.name,
          slug,
        })
        .returning();

      await this.writeAudit({
        ...actor,
        action: AUDIT_ACTIONS.CATEGORY_CREATED,
        description: "Kategori obat dibuat.",
        metadata: { code, slug },
        targetId: category.id,
        targetType: "medicine_category",
      });

      return this.getCategory(category.id);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictAppError("Kode atau slug kategori sudah digunakan.");
      }

      throw error;
    }
  }

  async updateCategory(
    id: string,
    input: CategoryUpdateInput,
    actor: MutationActor,
  ): Promise<CategoryListItem> {
    const current = await this.getCategory(id);
    const nextCode = input.code ? normalizeCode(input.code) : current.code;
    const nextSlug = input.slug ?? current.slug;

    const [conflict] = await readDb
      .select({ id: medicineCategories.id })
      .from(medicineCategories)
      .where(
        and(
          ne(medicineCategories.id, id),
          or(eq(medicineCategories.code, nextCode), eq(medicineCategories.slug, nextSlug)),
        ),
      )
      .limit(1);

    if (conflict) {
      throw new ConflictAppError("Kode atau slug kategori sudah digunakan.");
    }

    const changes: Partial<typeof medicineCategories.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.code !== undefined) changes.code = nextCode;
    if (input.description !== undefined) changes.description = input.description;
    if (input.isActive !== undefined) changes.isActive = input.isActive;
    if (input.name !== undefined) changes.name = input.name;
    if (input.slug !== undefined) changes.slug = input.slug;

    await db.update(medicineCategories).set(changes).where(eq(medicineCategories.id, id));
    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.CATEGORY_UPDATED,
      description: "Kategori obat diperbarui.",
      metadata: { code: nextCode, slug: nextSlug },
      targetId: id,
      targetType: "medicine_category",
    });

    return this.getCategory(id);
  }

  async deactivateCategory(id: string, actor: MutationActor) {
    await this.getCategory(id);

    const [usage] = await readDb
      .select({ total: countSql() })
      .from(medicines)
      .where(eq(medicines.categoryId, id));

    await db
      .update(medicineCategories)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(medicineCategories.id, id));

    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.CATEGORY_DEACTIVATED,
      description: "Kategori obat dinonaktifkan tanpa menghapus histori.",
      metadata: { medicineCount: Number(usage?.total ?? 0) },
      targetId: id,
      targetType: "medicine_category",
    });

    return this.getCategory(id);
  }

  async createSupplier(
    input: SupplierCreateInput,
    actor: MutationActor,
  ): Promise<SupplierListItem> {
    const code = normalizeCode(input.code);
    const [existing] = await readDb
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(eq(suppliers.code, code))
      .limit(1);

    if (existing) {
      throw new ConflictAppError("Kode supplier sudah digunakan.");
    }

    try {
      const [supplier] = await db
        .insert(suppliers)
        .values({
          address: input.address,
          code,
          contactName: input.contactName,
          email: input.email,
          isActive: input.isActive ?? true,
          name: input.name,
          phone: input.phone,
        })
        .returning();

      await this.writeAudit({
        ...actor,
        action: AUDIT_ACTIONS.SUPPLIER_CREATED,
        description: "Supplier dibuat.",
        metadata: { code },
        targetId: supplier.id,
        targetType: "supplier",
      });

      return this.getSupplier(supplier.id);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictAppError("Kode supplier sudah digunakan.");
      }

      throw error;
    }
  }

  async updateSupplier(
    id: string,
    input: SupplierUpdateInput,
    actor: MutationActor,
  ): Promise<SupplierListItem> {
    const current = await this.getSupplier(id);
    const nextCode = input.code ? normalizeCode(input.code) : current.code;

    const [conflict] = await readDb
      .select({ id: suppliers.id })
      .from(suppliers)
      .where(and(ne(suppliers.id, id), eq(suppliers.code, nextCode)))
      .limit(1);

    if (conflict) {
      throw new ConflictAppError("Kode supplier sudah digunakan.");
    }

    const changes: Partial<typeof suppliers.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.address !== undefined) changes.address = input.address;
    if (input.code !== undefined) changes.code = nextCode;
    if (input.contactName !== undefined) changes.contactName = input.contactName;
    if (input.email !== undefined) changes.email = input.email;
    if (input.isActive !== undefined) changes.isActive = input.isActive;
    if (input.name !== undefined) changes.name = input.name;
    if (input.phone !== undefined) changes.phone = input.phone;

    await db.update(suppliers).set(changes).where(eq(suppliers.id, id));
    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.SUPPLIER_UPDATED,
      description: "Supplier diperbarui.",
      metadata: { code: nextCode },
      targetId: id,
      targetType: "supplier",
    });

    return this.getSupplier(id);
  }

  async deactivateSupplier(id: string, actor: MutationActor) {
    await this.getSupplier(id);

    const [usage] = await readDb
      .select({ total: countSql() })
      .from(medicineBatches)
      .where(eq(medicineBatches.supplierId, id));

    await db
      .update(suppliers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(suppliers.id, id));

    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.SUPPLIER_DEACTIVATED,
      description: "Supplier dinonaktifkan tanpa menghapus histori batch.",
      metadata: { batchCount: Number(usage?.total ?? 0) },
      targetId: id,
      targetType: "supplier",
    });

    return this.getSupplier(id);
  }

  async createMedicine(
    input: MedicineCreateInput,
    actor: MutationActor,
  ): Promise<MedicineListItem> {
    const code = normalizeCode(input.code);
    const slug = getSlug(input.slug, input.name);
    await this.ensureCategoryUsable(input.categoryId);

    const [existing] = await readDb
      .select({ id: medicines.id })
      .from(medicines)
      .where(or(eq(medicines.code, code), eq(medicines.slug, slug)))
      .limit(1);

    if (existing) {
      throw new ConflictAppError("Kode atau slug obat sudah digunakan.");
    }

    try {
      const [medicine] = await db
        .insert(medicines)
        .values({
          categoryId: input.categoryId,
          code,
          criticalStockThreshold: input.criticalStockThreshold,
          description: input.description,
          lowStockThreshold: input.lowStockThreshold,
          name: input.name,
          prescriptionRequired: input.prescriptionRequired,
          sellingPrice: input.sellingPrice,
          slug,
          status: input.status,
          unit: input.unit,
        })
        .returning();

      await this.writeAudit({
        ...actor,
        action: AUDIT_ACTIONS.MEDICINE_CREATED,
        description: "Master obat dibuat.",
        metadata: { code, prescriptionRequired: input.prescriptionRequired, slug },
        targetId: medicine.id,
        targetType: "medicine",
      });

      return this.getMedicine(medicine.id);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictAppError("Kode atau slug obat sudah digunakan.");
      }

      throw error;
    }
  }

  async updateMedicine(
    id: string,
    input: MedicineUpdateInput,
    actor: MutationActor,
  ): Promise<MedicineListItem> {
    const current = await this.getMedicine(id);
    const nextCode = input.code ? normalizeCode(input.code) : current.code;
    const nextSlug = input.slug ?? current.slug;
    const nextCriticalThreshold =
      input.criticalStockThreshold ?? current.criticalStockThreshold;
    const nextLowThreshold = input.lowStockThreshold ?? current.lowStockThreshold;

    if (nextCriticalThreshold > nextLowThreshold) {
      throw new ValidationAppError(
        "Batas kritis tidak boleh lebih besar dari batas stok rendah.",
      );
    }

    if (input.categoryId !== undefined) {
      await this.ensureCategoryUsable(input.categoryId);
    }

    const [conflict] = await readDb
      .select({ id: medicines.id })
      .from(medicines)
      .where(
        and(
          ne(medicines.id, id),
          or(eq(medicines.code, nextCode), eq(medicines.slug, nextSlug)),
        ),
      )
      .limit(1);

    if (conflict) {
      throw new ConflictAppError("Kode atau slug obat sudah digunakan.");
    }

    const changes: Partial<typeof medicines.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.categoryId !== undefined) changes.categoryId = input.categoryId;
    if (input.code !== undefined) changes.code = nextCode;
    if (input.criticalStockThreshold !== undefined) {
      changes.criticalStockThreshold = input.criticalStockThreshold;
    }
    if (input.description !== undefined) changes.description = input.description;
    if (input.lowStockThreshold !== undefined) {
      changes.lowStockThreshold = input.lowStockThreshold;
    }
    if (input.name !== undefined) changes.name = input.name;
    if (input.prescriptionRequired !== undefined) {
      changes.prescriptionRequired = input.prescriptionRequired;
    }
    if (input.sellingPrice !== undefined) changes.sellingPrice = input.sellingPrice;
    if (input.slug !== undefined) changes.slug = input.slug;
    if (input.status !== undefined) changes.status = input.status;
    if (input.unit !== undefined) changes.unit = input.unit;

    await db.update(medicines).set(changes).where(eq(medicines.id, id));
    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.MEDICINE_UPDATED,
      description: "Master obat diperbarui.",
      metadata: { code: nextCode, slug: nextSlug },
      targetId: id,
      targetType: "medicine",
    });

    return this.getMedicine(id);
  }

  async deactivateMedicine(id: string, actor: MutationActor) {
    await this.getMedicine(id);

    const [usage] = await readDb
      .select({ total: countSql() })
      .from(orderItems)
      .where(eq(orderItems.medicineId, id));

    await db
      .update(medicines)
      .set({ status: "INACTIVE", updatedAt: new Date() })
      .where(eq(medicines.id, id));

    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.MEDICINE_DEACTIVATED,
      description: "Obat dinonaktifkan tanpa menghapus histori transaksi.",
      metadata: { orderItemCount: Number(usage?.total ?? 0) },
      targetId: id,
      targetType: "medicine",
    });

    return this.getMedicine(id);
  }

  async listMedicines(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<MedicineListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const categoryId = toString(filters.where.categoryId);
    const id = toString(filters.where.id);
    const slug = toString(filters.where.slug);
    const status = toString(filters.where.status) as MedicineStatus | undefined;
    const prescriptionRequired = toBooleanString(
      filters.where.prescriptionRequired,
    );
    const searchCondition = buildTextSearch(filters.search, [
      medicines.name,
      medicines.code,
      medicineCategories.name,
    ]);

    if (id) conditions.push(eq(medicines.id, id));
    if (slug) conditions.push(eq(medicines.slug, slug));
    if (categoryId) conditions.push(eq(medicines.categoryId, categoryId));
    if (status) conditions.push(eq(medicines.status, status));
    if (typeof prescriptionRequired === "boolean") {
      conditions.push(eq(medicines.prescriptionRequired, prescriptionRequired));
    }
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in MEDICINE_SORT_FIELDS
        ? filters.sortBy
        : "name";
    const sortColumn =
      MEDICINE_SORT_FIELDS[sortBy as keyof typeof MEDICINE_SORT_FIELDS];
    const orderBy = filters.sortDir === "desc" ? desc(sortColumn) : asc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: countSql() })
      .from(medicines)
      .leftJoin(
        medicineCategories,
        eq(medicines.categoryId, medicineCategories.id),
      )
      .$dynamic();

    if (whereClause) countQuery = countQuery.where(whereClause);

    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        categoryId: medicineCategories.id,
        categoryName: medicineCategories.name,
        categorySlug: medicineCategories.slug,
        code: medicines.code,
        createdAt: medicines.createdAt,
        criticalStockThreshold: medicines.criticalStockThreshold,
        id: medicines.id,
        lowStockThreshold: medicines.lowStockThreshold,
        name: medicines.name,
        prescriptionRequired: medicines.prescriptionRequired,
        primaryImageUrl: sql<string | null>`(
          select mi.public_url
          from medicine_images mi
          where mi.medicine_id = ${medicines.id} and mi.is_primary = true
          order by mi.created_at desc
          limit 1
        )`,
        sellingPrice: medicines.sellingPrice,
        slug: medicines.slug,
        status: medicines.status,
        totalAvailable: sql<number>`coalesce((
          select sum(mb.available_quantity)
          from medicine_batches mb
          where mb.medicine_id = ${medicines.id}
        ), 0)`,
        totalReserved: sql<number>`coalesce((
          select sum(mb.reserved_quantity)
          from medicine_batches mb
          where mb.medicine_id = ${medicines.id}
        ), 0)`,
        unit: medicines.unit,
      })
      .from(medicines)
      .leftJoin(
        medicineCategories,
        eq(medicines.categoryId, medicineCategories.id),
      )
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();

    if (whereClause) listQuery = listQuery.where(whereClause);

    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        category: {
          id: row.categoryId ?? null,
          name: row.categoryName ?? null,
          slug: row.categorySlug ?? null,
        },
        code: row.code,
        createdAt: row.createdAt,
        criticalStockThreshold: row.criticalStockThreshold,
        id: row.id,
        lowStockThreshold: row.lowStockThreshold,
        name: row.name,
        prescriptionRequired: row.prescriptionRequired,
        primaryImageUrl: row.primaryImageUrl ?? null,
        sellingPrice: row.sellingPrice,
        slug: row.slug,
        status: row.status,
        totalAvailable: Number(row.totalAvailable ?? 0),
        totalReserved: Number(row.totalReserved ?? 0),
        unit: row.unit,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async listCategories(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<CategoryListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const searchCondition = buildTextSearch(filters.search, [
      medicineCategories.name,
      medicineCategories.code,
      medicineCategories.slug,
    ]);
    const isActive = toBooleanString(filters.where.isActive);

    if (typeof isActive === "boolean") {
      conditions.push(eq(medicineCategories.isActive, isActive));
    }
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in CATEGORY_SORT_FIELDS
        ? filters.sortBy
        : "name";
    const sortColumn =
      CATEGORY_SORT_FIELDS[sortBy as keyof typeof CATEGORY_SORT_FIELDS];
    const orderBy = filters.sortDir === "desc" ? desc(sortColumn) : asc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: countSql() })
      .from(medicineCategories)
      .$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select()
      .from(medicineCategories)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        code: row.code,
        createdAt: row.createdAt,
        description: row.description ?? null,
        id: row.id,
        isActive: row.isActive,
        name: row.name,
        slug: row.slug,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async listSuppliers(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<SupplierListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const searchCondition = buildTextSearch(filters.search, [
      suppliers.name,
      suppliers.code,
      suppliers.phone,
      suppliers.email,
    ]);
    const isActive = toBooleanString(filters.where.isActive);

    if (typeof isActive === "boolean") {
      conditions.push(eq(suppliers.isActive, isActive));
    }
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in SUPPLIER_SORT_FIELDS
        ? filters.sortBy
        : "name";
    const sortColumn =
      SUPPLIER_SORT_FIELDS[sortBy as keyof typeof SUPPLIER_SORT_FIELDS];
    const orderBy = filters.sortDir === "desc" ? desc(sortColumn) : asc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb.select({ total: countSql() }).from(suppliers).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select()
      .from(suppliers)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        address: row.address ?? null,
        code: row.code,
        contactName: row.contactName ?? null,
        createdAt: row.createdAt,
        email: row.email ?? null,
        id: row.id,
        isActive: row.isActive,
        name: row.name,
        phone: row.phone ?? null,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async listBatches(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<BatchListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const status = toString(filters.where.status) as BatchStatus | undefined;
    const medicineId = toString(filters.where.medicineId);
    const expiryTo = toString(filters.where.expiryTo);
    const expiryWindow = toString(filters.where.expiryWindow);
    const searchCondition = buildTextSearch(filters.search, [
      medicineBatches.batchNumber,
      medicines.name,
      medicines.code,
      suppliers.name,
    ]);

    if (status) conditions.push(eq(medicineBatches.status, status));
    if (medicineId) conditions.push(eq(medicineBatches.medicineId, medicineId));
    if (expiryTo) {
      conditions.push(lte(medicineBatches.expiryDate, new Date(expiryTo)));
    }

    if (expiryWindow === "expired") {
      // Batches that are already past their expiry date and still have stock
      conditions.push(lt(medicineBatches.expiryDate, sql`current_date`));
      conditions.push(gt(medicineBatches.availableQuantity, 0));
    } else if (expiryWindow === "30" || expiryWindow === "60" || expiryWindow === "90") {
      const windowDays = Number(expiryWindow);
      // Batches expiring within N days from today (not yet expired)
      conditions.push(gte(medicineBatches.expiryDate, sql`current_date`));
      conditions.push(
        lte(medicineBatches.expiryDate, sql`current_date + interval '${sql.raw(String(windowDays))} days'`),
      );
      conditions.push(gt(medicineBatches.availableQuantity, 0));
      conditions.push(
        notInArray(medicineBatches.status, ["BLOCKED", "RECALLED"]),
      );
    }

    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in BATCH_SORT_FIELDS
        ? filters.sortBy
        : "expiryDate";
    const sortColumn =
      BATCH_SORT_FIELDS[sortBy as keyof typeof BATCH_SORT_FIELDS];
    const orderBy = filters.sortDir === "desc" ? desc(sortColumn) : asc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: countSql() })
      .from(medicineBatches)
      .innerJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .leftJoin(suppliers, eq(medicineBatches.supplierId, suppliers.id))
      .$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        availableQuantity: medicineBatches.availableQuantity,
        batchNumber: medicineBatches.batchNumber,
        expiryDate: medicineBatches.expiryDate,
        id: medicineBatches.id,
        medicineCode: medicines.code,
        medicineId: medicines.id,
        medicineName: medicines.name,
        medicineUnit: medicines.unit,
        purchaseCost: medicineBatches.purchaseCost,
        receivedDate: medicineBatches.receivedDate,
        reservedQuantity: medicineBatches.reservedQuantity,
        status: medicineBatches.status,
        supplierId: suppliers.id,
        supplierName: suppliers.name,
      })
      .from(medicineBatches)
      .innerJoin(medicines, eq(medicineBatches.medicineId, medicines.id))
      .leftJoin(suppliers, eq(medicineBatches.supplierId, suppliers.id))
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        availableQuantity: row.availableQuantity,
        batchNumber: row.batchNumber,
        expiryDate: row.expiryDate,
        id: row.id,
        medicine: {
          code: row.medicineCode,
          id: row.medicineId,
          name: row.medicineName,
          unit: row.medicineUnit,
        },
        purchaseCost: row.purchaseCost,
        receivedDate: row.receivedDate,
        reservedQuantity: row.reservedQuantity,
        status: row.status,
        supplier: {
          id: row.supplierId ?? null,
          name: row.supplierName ?? null,
        },
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async listStockMovements(
    searchParams: Record<string, unknown>,
  ): Promise<ListResponse<StockMovementListItem>> {
    const filters = getListFilters(searchParams);
    const conditions = [];
    const type = toString(filters.where.type) as StockMovementType | undefined;
    const dateFrom = toString(filters.where.dateFrom);
    const dateTo = toString(filters.where.dateTo);
    const searchCondition = buildTextSearch(filters.search, [
      stockMovements.reason,
      stockMovements.referenceId,
      medicineBatches.batchNumber,
      medicines.name,
      medicines.code,
    ]);

    if (type) conditions.push(eq(stockMovements.type, type));
    const parsedDateFrom = dateFrom ? parseDateFilter(dateFrom) : null;
    const parsedDateTo = dateTo ? parseDateFilter(dateTo, true) : null;

    if (parsedDateFrom) conditions.push(gte(stockMovements.createdAt, parsedDateFrom));
    if (parsedDateTo) conditions.push(lte(stockMovements.createdAt, parsedDateTo));
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in MOVEMENT_SORT_FIELDS
        ? filters.sortBy
        : "createdAt";
    const sortColumn =
      MOVEMENT_SORT_FIELDS[sortBy as keyof typeof MOVEMENT_SORT_FIELDS];
    const orderBy = filters.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb
      .select({ total: countSql() })
      .from(stockMovements)
      .innerJoin(medicines, eq(stockMovements.medicineId, medicines.id))
      .innerJoin(
        medicineBatches,
        eq(stockMovements.batchId, medicineBatches.id),
      )
      .$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        actorId: users.id,
        actorName: users.fullName,
        availableAfter: stockMovements.availableAfter,
        availableBefore: stockMovements.availableBefore,
        batchNumber: medicineBatches.batchNumber,
        createdAt: stockMovements.createdAt,
        id: stockMovements.id,
        medicineCode: medicines.code,
        medicineId: medicines.id,
        medicineName: medicines.name,
        quantityDelta: stockMovements.quantityDelta,
        reason: stockMovements.reason,
        referenceId: stockMovements.referenceId,
        referenceType: stockMovements.referenceType,
        type: stockMovements.type,
      })
      .from(stockMovements)
      .innerJoin(medicines, eq(stockMovements.medicineId, medicines.id))
      .innerJoin(
        medicineBatches,
        eq(stockMovements.batchId, medicineBatches.id),
      )
      .leftJoin(users, eq(stockMovements.actorUserId, users.id))
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        actor: {
          id: row.actorId ?? null,
          name: row.actorName ?? null,
        },
        availableAfter: row.availableAfter,
        availableBefore: row.availableBefore,
        batchNumber: row.batchNumber,
        createdAt: row.createdAt,
        id: row.id,
        medicine: {
          code: row.medicineCode,
          id: row.medicineId,
          name: row.medicineName,
        },
        quantityDelta: row.quantityDelta,
        reason: row.reason,
        referenceId: row.referenceId ?? null,
        referenceType: row.referenceType ?? null,
        type: row.type,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  /**
   * Returns a single batch with its medicine and supplier detail.
   */
  async getBatch(id: string): Promise<BatchListItem> {
    const result = await this.listBatches({ id, limit: "1", page: "1" });
    const batch = result.data.find((item) => item.id === id);

    if (!batch) {
      throw new NotFoundAppError("Batch tidak ditemukan.");
    }

    return batch;
  }

  /**
   * Returns all batches for a medicine without pagination.
   */
  async getBatchesForMedicine(medicineId: string): Promise<BatchListItem[]> {
    const result = await this.listBatches({ limit: "200", medicineId, page: "1" });

    return result.data;
  }

  /**
   * Records incoming stock as a new batch and creates the corresponding RECEIPT movement.
   */
  async createStockReceipt(
    input: StockReceiptInput,
    actor: MutationActor,
  ): Promise<BatchListItem> {
    const [medicine] = await readDb
      .select({ id: medicines.id, status: medicines.status })
      .from(medicines)
      .where(eq(medicines.id, input.medicineId))
      .limit(1);

    if (!medicine) {
      throw new NotFoundAppError("Obat tidak ditemukan.");
    }

    if (medicine.status !== "ACTIVE") {
      throw new ValidationAppError("Obat harus berstatus Aktif untuk menerima stok.");
    }

    const receivedDate = new Date(input.receivedDate);
    const expiryDate = new Date(input.expiryDate);

    if (expiryDate <= receivedDate) {
      throw new ValidationAppError(
        "Tanggal kedaluwarsa harus lebih besar dari tanggal terima.",
      );
    }

    const [duplicate] = await readDb
      .select({ id: medicineBatches.id })
      .from(medicineBatches)
      .where(
        and(
          eq(medicineBatches.medicineId, input.medicineId),
          eq(medicineBatches.batchNumber, input.batchNumber.trim()),
        ),
      )
      .limit(1);

    if (duplicate) {
      throw new ConflictAppError(
        "Nomor batch sudah digunakan untuk obat ini.",
      );
    }

    const [batch] = await db.transaction(async (tx) => {
      const [newBatch] = await tx
        .insert(medicineBatches)
        .values({
          availableQuantity: input.quantity,
          batchNumber: input.batchNumber.trim(),
          expiryDate,
          medicineId: input.medicineId,
          purchaseCost: input.purchaseCost,
          receivedDate,
          reservedQuantity: 0,
          status: "AVAILABLE",
          supplierId: input.supplierId ?? null,
        })
        .returning();

      await tx.insert(stockMovements).values({
        actorUserId: actor.actorUserId,
        availableAfter: input.quantity,
        availableBefore: 0,
        batchId: newBatch.id,
        medicineId: input.medicineId,
        quantityDelta: input.quantity,
        reason: "Stok diterima",
        referenceId: newBatch.id,
        referenceType: "batch",
        reservedAfter: 0,
        reservedBefore: 0,
        type: "RECEIPT",
      });

      return [newBatch];
    });

    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.BATCH_CREATED,
      description: "Batch stok diterima.",
      metadata: {
        batchNumber: batch.batchNumber,
        medicineId: input.medicineId,
        quantity: input.quantity,
      },
      targetId: batch.id,
      targetType: "medicine_batch",
    });

    return this.getBatch(batch.id);
  }

  /**
   * Applies a stock adjustment (in or out) to an existing batch.
   */
  async adjustStock(
    input: StockAdjustmentInput,
    actor: MutationActor,
  ): Promise<BatchListItem> {
    const [batch] = await readDb
      .select({
        availableQuantity: medicineBatches.availableQuantity,
        id: medicineBatches.id,
        medicineId: medicineBatches.medicineId,
        reservedQuantity: medicineBatches.reservedQuantity,
        status: medicineBatches.status,
      })
      .from(medicineBatches)
      .where(eq(medicineBatches.id, input.batchId))
      .limit(1);

    if (!batch) {
      throw new NotFoundAppError("Batch tidak ditemukan.");
    }

    if (batch.status === "RECALLED") {
      throw new ValidationAppError("Batch yang ditarik tidak dapat disesuaikan.");
    }

    const isOut = input.adjustmentType === "ADJUSTMENT_OUT";
    const newAvailable = isOut
      ? batch.availableQuantity - input.quantity
      : batch.availableQuantity + input.quantity;

    if (newAvailable < 0) {
      throw new InsufficientStockError(
        `Penyesuaian keluar melebihi stok tersedia (${batch.availableQuantity}).`,
      );
    }

    const nextStatus: BatchStatus =
      newAvailable === 0 && batch.reservedQuantity === 0 ? "DEPLETED" : batch.status;

    await db.transaction(async (tx) => {
      await tx
        .update(medicineBatches)
        .set({
          availableQuantity: newAvailable,
          status: nextStatus,
          updatedAt: new Date(),
        })
        .where(eq(medicineBatches.id, input.batchId));

      await tx.insert(stockMovements).values({
        actorUserId: actor.actorUserId,
        availableAfter: newAvailable,
        availableBefore: batch.availableQuantity,
        batchId: input.batchId,
        medicineId: batch.medicineId,
        quantityDelta: isOut ? -input.quantity : input.quantity,
        reason: input.reason,
        referenceId: input.batchId,
        referenceType: "batch_adjustment",
        reservedAfter: batch.reservedQuantity,
        reservedBefore: batch.reservedQuantity,
        type: "ADJUSTMENT",
      });
    });

    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.STOCK_ADJUSTED,
      description: `Stok batch disesuaikan (${input.adjustmentType}).`,
      metadata: {
        adjustmentType: input.adjustmentType,
        batchId: input.batchId,
        quantity: input.quantity,
        reason: input.reason,
      },
      targetId: input.batchId,
      targetType: "medicine_batch",
    });

    return this.getBatch(input.batchId);
  }

  /**
   * Blocks a batch to prevent further allocation.
   */
  async blockBatch(
    batchId: string,
    reason: string,
    actor: MutationActor,
  ): Promise<BatchListItem> {
    const [batch] = await readDb
      .select({
        availableQuantity: medicineBatches.availableQuantity,
        id: medicineBatches.id,
        medicineId: medicineBatches.medicineId,
        reservedQuantity: medicineBatches.reservedQuantity,
        status: medicineBatches.status,
      })
      .from(medicineBatches)
      .where(eq(medicineBatches.id, batchId))
      .limit(1);

    if (!batch) {
      throw new NotFoundAppError("Batch tidak ditemukan.");
    }

    if (batch.status === "BLOCKED") {
      throw new ValidationAppError("Batch sudah dalam status Diblokir.");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(medicineBatches)
        .set({ status: "BLOCKED", updatedAt: new Date() })
        .where(eq(medicineBatches.id, batchId));

      await tx.insert(stockMovements).values({
        actorUserId: actor.actorUserId,
        availableAfter: batch.availableQuantity,
        availableBefore: batch.availableQuantity,
        batchId,
        medicineId: batch.medicineId,
        quantityDelta: 0,
        reason,
        referenceId: batchId,
        referenceType: "batch_block",
        reservedAfter: batch.reservedQuantity,
        reservedBefore: batch.reservedQuantity,
        type: "ADJUSTMENT",
      });
    });

    await this.writeAudit({
      ...actor,
      action: AUDIT_ACTIONS.STOCK_ADJUSTED,
      description: "Batch diblokir.",
      metadata: { batchId, reason },
      targetId: batchId,
      targetType: "medicine_batch",
    });

    return this.getBatch(batchId);
  }
}
