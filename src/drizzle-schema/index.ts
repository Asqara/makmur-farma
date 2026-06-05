import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  inet,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import {
  AUDIT_RESULT_VALUES,
  USER_ROLE_VALUES,
  USER_STATUS_VALUES,
} from "@/constants/auth";
import {
  BATCH_STATUS_VALUES,
  ERROR_SEVERITY_VALUES,
  IMPORT_ROW_STATUS_VALUES,
  JOB_STATUS_VALUES,
  JOB_TYPE_VALUES,
  MEDICINE_STATUS_VALUES,
  ORDER_CHANNEL_VALUES,
  ORDER_STATUS_VALUES,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_VALUES,
  PRESCRIPTION_STATUS_VALUES,
  STOCK_MOVEMENT_TYPE_VALUES,
} from "@/constants/domain";

const timestampz = (name: string) =>
  timestamp(name, { mode: "date", withTimezone: true });

export const userRoleEnum = pgEnum("user_role", USER_ROLE_VALUES);
export const userStatusEnum = pgEnum("user_status", USER_STATUS_VALUES);
export const auditResultEnum = pgEnum("audit_result", AUDIT_RESULT_VALUES);
export const notificationSeverityEnum = pgEnum("notification_severity", [
  "critical",
  "warning",
  "info",
  "success",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "LOW_STOCK",
  "EXPIRING_MEDICINE",
  "NEW_ORDER",
  "PRESCRIPTION_REVIEW",
  "PRESCRIPTION_APPROVED",
  "PRESCRIPTION_REJECTED",
  "PAYMENT_STATUS",
  "ORDER_PROCESSING",
  "READY_FOR_PICKUP",
  "SHIPPED",
  "COMPLETED",
  "APPLICATION_ERROR",
  "SYSTEM_ERROR",
  "RESPONSE_TIME_ALERT",
  "UPTIME_ALERT",
  "IMPORT_COMPLETED",
  "IMPORT_FAILED",
  "REPORT_COMPLETED",
  "REPORT_FAILED",
  "JOB_FAILED",
]);
export const medicineStatusEnum = pgEnum(
  "medicine_status",
  MEDICINE_STATUS_VALUES,
);
export const batchStatusEnum = pgEnum("batch_status", BATCH_STATUS_VALUES);
export const stockMovementTypeEnum = pgEnum(
  "stock_movement_type",
  STOCK_MOVEMENT_TYPE_VALUES,
);
export const orderChannelEnum = pgEnum("order_channel", ORDER_CHANNEL_VALUES);
export const orderStatusEnum = pgEnum("order_status", ORDER_STATUS_VALUES);
export const prescriptionStatusEnum = pgEnum(
  "prescription_status",
  PRESCRIPTION_STATUS_VALUES,
);
export const paymentStatusEnum = pgEnum("payment_status", PAYMENT_STATUS_VALUES);
export const paymentMethodEnum = pgEnum("payment_method", PAYMENT_METHOD_VALUES);
export const jobStatusEnum = pgEnum("job_status", JOB_STATUS_VALUES);
export const jobTypeEnum = pgEnum("job_type", JOB_TYPE_VALUES);
export const importRowStatusEnum = pgEnum(
  "import_row_status",
  IMPORT_ROW_STATUS_VALUES,
);
export const errorSeverityEnum = pgEnum("error_severity", ERROR_SEVERITY_VALUES);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("name").notNull(),
    email: text("email").notNull(),
    normalizedEmail: text("normalized_email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").default("CUSTOMER").notNull(),
    status: userStatusEnum("status").default("PENDING_VERIFICATION").notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    emailVerifiedAt: timestampz("email_verified_at"),
    lastLoginAt: timestampz("last_login_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_idx").on(table.email),
    isActiveIdx: index("users_is_active_idx").on(table.isActive),
    normalizedEmailIdx: uniqueIndex("users_normalized_email_idx").on(
      table.normalizedEmail,
    ),
    roleIdx: index("users_role_idx").on(table.role),
    statusIdx: index("users_status_idx").on(table.status),
  }),
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("session_token_hash").notNull(),
    csrfTokenHash: text("csrf_token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: inet("ip_address"),
    lastActivityAt: timestampz("last_activity_at").defaultNow().notNull(),
    idleExpiresAt: timestampz("idle_expires_at").notNull(),
    absoluteExpiresAt: timestampz("expires_at").notNull(),
    revokedAt: timestampz("revoked_at"),
    revokedReason: text("revoked_reason"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    absoluteExpiresAtIdx: index("sessions_expires_at_idx").on(
      table.absoluteExpiresAt,
    ),
    idleExpiresAtIdx: index("sessions_idle_expires_at_idx").on(
      table.idleExpiresAt,
    ),
    revokedAtIdx: index("sessions_revoked_at_idx").on(table.revokedAt),
    tokenHashIdx: uniqueIndex("sessions_session_token_hash_idx").on(
      table.tokenHash,
    ),
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestampz("expires_at").notNull(),
    usedAt: timestampz("used_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    expiresAtIdx: index("email_verification_tokens_expires_at_idx").on(
      table.expiresAt,
    ),
    tokenHashIdx: uniqueIndex("email_verification_tokens_token_hash_idx").on(
      table.tokenHash,
    ),
    userIdIdx: index("email_verification_tokens_user_id_idx").on(table.userId),
  }),
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorRole: userRoleEnum("actor_role"),
    action: text("action").notNull(),
    targetType: text("entity_type").notNull(),
    targetId: text("entity_id"),
    result: auditResultEnum("result").notNull(),
    description: text("description").notNull(),
    ipAddress: inet("ip_address"),
    userAgent: text("user_agent"),
    correlationId: text("correlation_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    actionIdx: index("audit_logs_action_idx").on(table.action),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    entityIdx: index("audit_logs_entity_idx").on(
      table.targetType,
      table.targetId,
    ),
    userIdIdx: index("audit_logs_user_id_idx").on(table.actorUserId),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    roleTarget: userRoleEnum("role_target"),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    severity: notificationSeverityEnum("severity").notNull(),
    isRead: boolean("is_read").default(false).notNull(),
    readAt: timestampz("read_at"),
    dedupeKey: text("dedupe_key"),
    deliveryStatus: text("delivery_status").default("pending").notNull(),
    emailStatus: text("email_status"),
    actionHref: text("action_href"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
    isReadIdx: index("notifications_is_read_idx").on(table.isRead),
    roleTargetIdx: index("notifications_role_target_idx").on(table.roleTarget),
    severityIdx: index("notifications_severity_idx").on(table.severity),
    typeIdx: index("notifications_type_idx").on(table.type),
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    dedupeKeyIdx: uniqueIndex("notifications_dedupe_key_idx").on(
      table.dedupeKey,
    ),
  }),
);

export const customerProfiles = pgTable(
  "customer_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    addressLine: text("address_line"),
    city: text("city"),
    province: text("province"),
    postalCode: text("postal_code"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: uniqueIndex("customer_profiles_user_id_idx").on(table.userId),
  }),
);

export const medicineCategories = pgTable(
  "medicine_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("medicine_categories_code_idx").on(table.code),
    isActiveIdx: index("medicine_categories_is_active_idx").on(table.isActive),
    nameIdx: index("medicine_categories_name_idx").on(table.name),
    slugIdx: uniqueIndex("medicine_categories_slug_idx").on(table.slug),
  }),
);

export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    contactName: text("contact_name"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    codeIdx: uniqueIndex("suppliers_code_idx").on(table.code),
    isActiveIdx: index("suppliers_is_active_idx").on(table.isActive),
    nameIdx: index("suppliers_name_idx").on(table.name),
  }),
);

export const medicines = pgTable(
  "medicines",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    categoryId: uuid("category_id").references(() => medicineCategories.id, {
      onDelete: "set null",
    }),
    code: text("code").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    unit: text("unit").default("unit").notNull(),
    status: medicineStatusEnum("status").default("ACTIVE").notNull(),
    prescriptionRequired: boolean("prescription_required")
      .default(false)
      .notNull(),
    sellingPrice: numeric("selling_price", {
      precision: 14,
      scale: 2,
    }).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(10).notNull(),
    criticalStockThreshold: integer("critical_stock_threshold")
      .default(3)
      .notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    categoryIdx: index("medicines_category_id_idx").on(table.categoryId),
    codeIdx: uniqueIndex("medicines_code_idx").on(table.code),
    nameIdx: index("medicines_name_idx").on(table.name),
    prescriptionRequiredIdx: index("medicines_prescription_required_idx").on(
      table.prescriptionRequired,
    ),
    slugIdx: uniqueIndex("medicines_slug_idx").on(table.slug),
    statusIdx: index("medicines_status_idx").on(table.status),
  }),
);

export const medicineImages = pgTable(
  "medicine_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "cascade" }),
    objectKey: text("object_key").notNull(),
    publicUrl: text("public_url"),
    altText: text("alt_text"),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    medicineIdIdx: index("medicine_images_medicine_id_idx").on(
      table.medicineId,
    ),
    objectKeyIdx: uniqueIndex("medicine_images_object_key_idx").on(
      table.objectKey,
    ),
  }),
);

export const medicineBatches = pgTable(
  "medicine_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "restrict" }),
    supplierId: uuid("supplier_id").references(() => suppliers.id, {
      onDelete: "set null",
    }),
    batchNumber: text("batch_number").notNull(),
    receivedDate: date("received_date", { mode: "date" }).notNull(),
    expiryDate: date("expiry_date", { mode: "date" }).notNull(),
    purchaseCost: numeric("purchase_cost", {
      precision: 14,
      scale: 2,
    }).notNull(),
    availableQuantity: integer("available_quantity").default(0).notNull(),
    reservedQuantity: integer("reserved_quantity").default(0).notNull(),
    status: batchStatusEnum("status").default("AVAILABLE").notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    expiryIdx: index("medicine_batches_expiry_date_idx").on(table.expiryDate),
    medicineBatchIdx: uniqueIndex("medicine_batches_medicine_batch_idx").on(
      table.medicineId,
      table.batchNumber,
    ),
    medicineIdIdx: index("medicine_batches_medicine_id_idx").on(
      table.medicineId,
    ),
    statusIdx: index("medicine_batches_status_idx").on(table.status),
    supplierIdIdx: index("medicine_batches_supplier_id_idx").on(
      table.supplierId,
    ),
  }),
);

export const carts = pgTable(
  "carts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: text("status").default("ACTIVE").notNull(),
    convertedOrderId: uuid("converted_order_id"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    customerStatusIdx: index("carts_customer_status_idx").on(
      table.customerUserId,
      table.status,
    ),
  }),
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    cartId: uuid("cart_id")
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    cartMedicineIdx: uniqueIndex("cart_items_cart_medicine_idx").on(
      table.cartId,
      table.medicineId,
    ),
    medicineIdIdx: index("cart_items_medicine_id_idx").on(table.medicineId),
  }),
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderNumber: text("order_number").notNull(),
    customerUserId: uuid("customer_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    cashierUserId: uuid("cashier_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    channel: orderChannelEnum("channel").notNull(),
    status: orderStatusEnum("status").default("DRAFT").notNull(),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
    discountTotal: numeric("discount_total", {
      precision: 14,
      scale: 2,
    })
      .default("0")
      .notNull(),
    taxTotal: numeric("tax_total", { precision: 14, scale: 2 })
      .default("0")
      .notNull(),
    grandTotal: numeric("grand_total", { precision: 14, scale: 2 }).notNull(),
    prescriptionRequired: boolean("prescription_required")
      .default(false)
      .notNull(),
    fulfillmentMethod: text("fulfillment_method").default("PICKUP").notNull(),
    idempotencyKey: text("idempotency_key"),
    expiresAt: timestampz("expires_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    cashierIdx: index("orders_cashier_user_id_idx").on(table.cashierUserId),
    channelIdx: index("orders_channel_idx").on(table.channel),
    createdAtIdx: index("orders_created_at_idx").on(table.createdAt),
    customerIdx: index("orders_customer_user_id_idx").on(table.customerUserId),
    idempotencyKeyIdx: uniqueIndex("orders_idempotency_key_idx").on(
      table.idempotencyKey,
    ),
    orderNumberIdx: uniqueIndex("orders_order_number_idx").on(
      table.orderNumber,
    ),
    statusIdx: index("orders_status_idx").on(table.status),
  }),
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
    prescriptionRequired: boolean("prescription_required")
      .default(false)
      .notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    medicineIdIdx: index("order_items_medicine_id_idx").on(table.medicineId),
    orderIdIdx: index("order_items_order_id_idx").on(table.orderId),
  }),
);

export const orderStatusHistory = pgTable(
  "order_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    fromStatus: orderStatusEnum("from_status"),
    toStatus: orderStatusEnum("to_status").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    note: text("note"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    actorUserIdIdx: index("order_status_history_actor_user_id_idx").on(
      table.actorUserId,
    ),
    orderIdIdx: index("order_status_history_order_id_idx").on(table.orderId),
  }),
);

export const prescriptions = pgTable(
  "prescriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    customerUserId: uuid("customer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    originalObjectKey: text("original_object_key").notNull(),
    originalFileName: text("original_file_name").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    status: prescriptionStatusEnum("status").default("PENDING").notNull(),
    submittedAt: timestampz("submitted_at").defaultNow().notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    customerUserIdIdx: index("prescriptions_customer_user_id_idx").on(
      table.customerUserId,
    ),
    orderIdIdx: index("prescriptions_order_id_idx").on(table.orderId),
    statusIdx: index("prescriptions_status_idx").on(table.status),
  }),
);

export const prescriptionReviews = pgTable(
  "prescription_reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prescriptionId: uuid("prescription_id")
      .notNull()
      .references(() => prescriptions.id, { onDelete: "cascade" }),
    pharmacistUserId: uuid("pharmacist_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    decision: prescriptionStatusEnum("decision").notNull(),
    notes: text("notes").notNull(),
    approvedItems: jsonb("approved_items")
      .$type<Array<{ medicineId: string; quantity: number }>>()
      .default(sql`'[]'::jsonb`)
      .notNull(),
    reviewedAt: timestampz("reviewed_at").defaultNow().notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    pharmacistUserIdIdx: index("prescription_reviews_pharmacist_user_id_idx").on(
      table.pharmacistUserId,
    ),
    prescriptionIdIdx: index("prescription_reviews_prescription_id_idx").on(
      table.prescriptionId,
    ),
  }),
);

export const stockReservations = pgTable(
  "stock_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    orderItemId: uuid("order_item_id").references(() => orderItems.id, {
      onDelete: "cascade",
    }),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "restrict" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => medicineBatches.id, { onDelete: "restrict" }),
    quantity: integer("quantity").notNull(),
    releasedAt: timestampz("released_at"),
    fulfilledAt: timestampz("fulfilled_at"),
    expiresAt: timestampz("expires_at").notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    activeReservationIdx: index("stock_reservations_active_idx").on(
      table.orderId,
      table.releasedAt,
      table.fulfilledAt,
    ),
    batchIdIdx: index("stock_reservations_batch_id_idx").on(table.batchId),
    expiresAtIdx: index("stock_reservations_expires_at_idx").on(
      table.expiresAt,
    ),
    orderIdIdx: index("stock_reservations_order_id_idx").on(table.orderId),
  }),
);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    medicineId: uuid("medicine_id")
      .notNull()
      .references(() => medicines.id, { onDelete: "restrict" }),
    batchId: uuid("batch_id")
      .notNull()
      .references(() => medicineBatches.id, { onDelete: "restrict" }),
    type: stockMovementTypeEnum("type").notNull(),
    quantityDelta: integer("quantity_delta").notNull(),
    availableBefore: integer("available_before").notNull(),
    availableAfter: integer("available_after").notNull(),
    reservedBefore: integer("reserved_before").notNull(),
    reservedAfter: integer("reserved_after").notNull(),
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    reason: text("reason").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    actorUserIdIdx: index("stock_movements_actor_user_id_idx").on(
      table.actorUserId,
    ),
    batchIdIdx: index("stock_movements_batch_id_idx").on(table.batchId),
    createdAtIdx: index("stock_movements_created_at_idx").on(table.createdAt),
    medicineIdIdx: index("stock_movements_medicine_id_idx").on(
      table.medicineId,
    ),
    referenceIdx: index("stock_movements_reference_idx").on(
      table.referenceType,
      table.referenceId,
    ),
    typeIdx: index("stock_movements_type_idx").on(table.type),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "restrict" }),
    provider: text("provider").default("manual").notNull(),
    providerReference: text("provider_reference"),
    method: paymentMethodEnum("method").notNull(),
    status: paymentStatusEnum("status").default("PENDING").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    idempotencyKey: text("idempotency_key"),
    callbackVerifiedAt: timestampz("callback_verified_at"),
    paidAt: timestampz("paid_at"),
    expiresAt: timestampz("expires_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    idempotencyKeyIdx: uniqueIndex("payments_idempotency_key_idx").on(
      table.idempotencyKey,
    ),
    orderIdIdx: index("payments_order_id_idx").on(table.orderId),
    providerReferenceIdx: uniqueIndex("payments_provider_reference_idx").on(
      table.providerReference,
    ),
    statusIdx: index("payments_status_idx").on(table.status),
  }),
);

export const paymentEvents = pgTable(
  "payment_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id, { onDelete: "cascade" }),
    providerEventId: text("provider_event_id"),
    eventType: text("event_type").notNull(),
    status: paymentStatusEnum("status").notNull(),
    safePayload: jsonb("safe_payload")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    receivedAt: timestampz("received_at").defaultNow().notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    paymentIdIdx: index("payment_events_payment_id_idx").on(table.paymentId),
    providerEventIdIdx: uniqueIndex("payment_events_provider_event_id_idx").on(
      table.providerEventId,
    ),
  }),
);

export const reportRuns = pgTable(
  "report_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").notNull(),
    filters: jsonb("filters")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    status: jobStatusEnum("status").default("QUEUED").notNull(),
    progress: integer("progress").default(0).notNull(),
    requesterUserId: uuid("requester_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    fileObjectKey: text("file_object_key"),
    filename: text("filename"),
    fileSizeBytes: integer("file_size_bytes"),
    safeError: text("safe_error"),
    startedAt: timestampz("started_at"),
    completedAt: timestampz("completed_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("report_runs_created_at_idx").on(table.createdAt),
    requesterUserIdIdx: index("report_runs_requester_user_id_idx").on(
      table.requesterUserId,
    ),
    statusIdx: index("report_runs_status_idx").on(table.status),
    typeIdx: index("report_runs_type_idx").on(table.type),
  }),
);

export const importRuns = pgTable(
  "import_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: text("type").default("MEDICINE").notNull(),
    status: jobStatusEnum("status").default("QUEUED").notNull(),
    requesterUserId: uuid("requester_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    sourceFileObjectKey: text("source_file_object_key").notNull(),
    originalFileName: text("original_file_name").notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    mapping: jsonb("mapping")
      .$type<Record<string, string>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    totalRows: integer("total_rows").default(0).notNull(),
    validRows: integer("valid_rows").default(0).notNull(),
    failedRows: integer("failed_rows").default(0).notNull(),
    processedRows: integer("processed_rows").default(0).notNull(),
    safeError: text("safe_error"),
    startedAt: timestampz("started_at"),
    completedAt: timestampz("completed_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("import_runs_created_at_idx").on(table.createdAt),
    requesterUserIdIdx: index("import_runs_requester_user_id_idx").on(
      table.requesterUserId,
    ),
    statusIdx: index("import_runs_status_idx").on(table.status),
  }),
);

export const importRowResults = pgTable(
  "import_row_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    importRunId: uuid("import_run_id")
      .notNull()
      .references(() => importRuns.id, { onDelete: "cascade" }),
    rowNumber: integer("row_number").notNull(),
    status: importRowStatusEnum("status").notNull(),
    message: text("message"),
    payload: jsonb("payload")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    importRunRowIdx: uniqueIndex("import_row_results_run_row_idx").on(
      table.importRunId,
      table.rowNumber,
    ),
    statusIdx: index("import_row_results_status_idx").on(table.status),
  }),
);

export const jobRuns = pgTable(
  "job_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    queueName: text("queue_name").notNull(),
    jobType: jobTypeEnum("job_type").notNull(),
    jobKey: text("job_key").notNull(),
    status: jobStatusEnum("status").default("QUEUED").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    progress: integer("progress").default(0).notNull(),
    attempt: integer("attempt").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(3).notNull(),
    safeError: text("safe_error"),
    correlationId: text("correlation_id"),
    lockedAt: timestampz("locked_at"),
    startedAt: timestampz("started_at"),
    completedAt: timestampz("completed_at"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("job_runs_created_at_idx").on(table.createdAt),
    entityIdx: index("job_runs_entity_idx").on(
      table.entityType,
      table.entityId,
    ),
    jobKeyIdx: uniqueIndex("job_runs_job_key_idx").on(table.jobKey),
    queueStatusIdx: index("job_runs_queue_status_idx").on(
      table.queueName,
      table.status,
    ),
    statusIdx: index("job_runs_status_idx").on(table.status),
  }),
);

export const applicationErrors = pgTable(
  "application_errors",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    severity: errorSeverityEnum("severity").notNull(),
    source: text("source").notNull(),
    safeMessage: text("safe_message").notNull(),
    diagnosticDetail: text("diagnostic_detail"),
    correlationId: text("correlation_id"),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestampz("resolved_at"),
    resolvedByUserId: uuid("resolved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    resolutionNote: text("resolution_note"),
    createdAt: timestampz("created_at").defaultNow().notNull(),
    updatedAt: timestampz("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    createdAtIdx: index("application_errors_created_at_idx").on(
      table.createdAt,
    ),
    correlationIdIdx: index("application_errors_correlation_id_idx").on(
      table.correlationId,
    ),
    severityIdx: index("application_errors_severity_idx").on(table.severity),
    sourceIdx: index("application_errors_source_idx").on(table.source),
  }),
);

export type AuditLogRow = typeof auditLogs.$inferSelect;
export type ApplicationErrorRow = typeof applicationErrors.$inferSelect;
export type CartItemRow = typeof cartItems.$inferSelect;
export type CartRow = typeof carts.$inferSelect;
export type CustomerProfileRow = typeof customerProfiles.$inferSelect;
export type EmailVerificationTokenRow =
  typeof emailVerificationTokens.$inferSelect;
export type ImportRowResultRow = typeof importRowResults.$inferSelect;
export type ImportRunRow = typeof importRuns.$inferSelect;
export type JobRunRow = typeof jobRuns.$inferSelect;
export type MedicineBatchRow = typeof medicineBatches.$inferSelect;
export type MedicineCategoryRow = typeof medicineCategories.$inferSelect;
export type MedicineImageRow = typeof medicineImages.$inferSelect;
export type MedicineRow = typeof medicines.$inferSelect;
export type NotificationRow = typeof notifications.$inferSelect;
export type OrderItemRow = typeof orderItems.$inferSelect;
export type OrderRow = typeof orders.$inferSelect;
export type OrderStatusHistoryRow = typeof orderStatusHistory.$inferSelect;
export type PaymentEventRow = typeof paymentEvents.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type PrescriptionReviewRow = typeof prescriptionReviews.$inferSelect;
export type PrescriptionRow = typeof prescriptions.$inferSelect;
export type ReportRunRow = typeof reportRuns.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type StockMovementRow = typeof stockMovements.$inferSelect;
export type StockReservationRow = typeof stockReservations.$inferSelect;
export type SupplierRow = typeof suppliers.$inferSelect;
export type UserRow = typeof users.$inferSelect;
