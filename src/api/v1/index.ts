import { Elysia } from "elysia";
import { ZodError, type ZodType } from "zod";

import { client } from "@/client";
import {
  requirePermission,
  requireRole,
  requireSession,
} from "@/api/middlewares/session";
import { createAuthCookies, createClearAuthCookies } from "@/lib/session";
import { assertSafeMutationOrigin, assertSessionCsrf } from "@/lib/csrf";
import { getRequestContext } from "@/lib/request";
import { ForbiddenError, ValidationAppError } from "@/lib/errors";
import {
  Auth,
  Cart,
  ErrorLogs,
  Imports,
  Inventory,
  MasterData,
  Notifications,
  Orders,
  Payments,
  Prescriptions,
  Reports,
  Users,
} from "@/zod-schemas";
import { ENV } from "@/constants/config";

function setCookieHeaders(set: { headers: Record<string, string | number> }, cookies: string[]) {
  set.headers["Set-Cookie"] = cookies as unknown as string;
}

function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      const firstIssue = error.issues[0];

      throw new ValidationAppError(
        firstIssue?.message ?? "Data yang dikirim tidak valid.",
      );
    }

    throw error;
  }
}

function getMutationActor(
  session: Awaited<ReturnType<typeof requireSession>>,
  request: Request,
) {
  return {
    actorRole: session.user.role,
    actorUserId: session.userId,
    requestContext: getRequestContext(request),
  };
}

/**
 * Versioned application API.
 */
export const v1Api = new Elysia()
  .group("/api/v1/auth", (app) =>
    app
      .post("/register", async ({ body, request }) => {
        assertSafeMutationOrigin(request);

        return client.auth.register(
          parseBody(Auth.register, body),
          getRequestContext(request),
        );
      })
      .post("/login", async ({ body, request, set }) => {
        assertSafeMutationOrigin(request);

        const result = await client.auth.login(
          parseBody(Auth.login, body),
          getRequestContext(request),
        );
        const cookies = createAuthCookies(
          result.sessionToken,
          result.csrfToken,
        );

        setCookieHeaders(set, cookies);

        return {
          redirectTo: result.redirectTo,
          user: result.user,
        };
      })
      .get("/session", async ({ request }) =>
        client.auth.getCurrentSession(request, getRequestContext(request)),
      )
      .post("/logout", async ({ request, set }) => {
        const requestContext = getRequestContext(request);
        const activeSession = await client.auth
          .validateRequestSession(request, requestContext)
          .catch(() => null);

        if (activeSession) {
          assertSessionCsrf(request, activeSession.csrfTokenHash);
        }

        const result = await client.auth.logout(request, requestContext);

        setCookieHeaders(set, createClearAuthCookies());

        return result;
      })
      .post("/verify-email", async ({ body, request }) => {
        assertSafeMutationOrigin(request);

        return client.auth.verifyEmail(
          parseBody(Auth.verifyEmail, body),
          getRequestContext(request),
        );
      })
      .post("/resend-verification", async ({ body, request }) => {
        assertSafeMutationOrigin(request);

        return client.auth.resendVerification(
          parseBody(Auth.resendVerification, body),
          getRequestContext(request),
        );
      }),
  )
  .get("/api/v1/profile", async ({ request }) =>
    client.auth.getCurrentSession(request, getRequestContext(request)),
  )
  .get("/api/v1/dashboard/overview", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "dashboard.read");

    return client.dashboard.getOverview(query as Record<string, unknown>);
  })
  .group("/api/v1/catalog", (app) =>
    app
      .get("/medicines", async ({ query }) =>
        client.medicines.listMedicines({
          ...(query as Record<string, unknown>),
          status: "ACTIVE",
        }),
      )
      .get("/medicines/:slug", async ({ params }) =>
        client.medicines.getMedicineDetailBySlug(params.slug),
      )
      .get("/categories", async ({ query }) =>
        client.medicines.listCategories({
          ...(query as Record<string, unknown>),
          isActive: "true",
        }),
      ),
  )
  .get("/api/v1/medicines", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "medicine.read");

    return client.medicines.listMedicines(query as Record<string, unknown>);
  })
  .post("/api/v1/medicines", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "medicine.write");
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.medicines.createMedicine(
      parseBody(MasterData.medicineCreate, body),
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/medicines/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "medicine.read");
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.getMedicine(parsedParams.id);
  })
  .put("/api/v1/medicines/:id", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "medicine.write");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.updateMedicine(
      parsedParams.id,
      parseBody(MasterData.medicineUpdate, body),
      getMutationActor(session, request),
    );
  })
  .delete("/api/v1/medicines/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "medicine.delete");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.deactivateMedicine(
      parsedParams.id,
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/categories", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "category.read");

    return client.medicines.listCategories(query as Record<string, unknown>);
  })
  .post("/api/v1/categories", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "category.write");
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.medicines.createCategory(
      parseBody(MasterData.categoryCreate, body),
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/categories/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "category.read");
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.getCategory(parsedParams.id);
  })
  .put("/api/v1/categories/:id", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "category.write");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.updateCategory(
      parsedParams.id,
      parseBody(MasterData.categoryUpdate, body),
      getMutationActor(session, request),
    );
  })
  .delete("/api/v1/categories/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "category.write");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.deactivateCategory(
      parsedParams.id,
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/suppliers", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "supplier.read");

    return client.medicines.listSuppliers(query as Record<string, unknown>);
  })
  .post("/api/v1/suppliers", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "supplier.write");
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.medicines.createSupplier(
      parseBody(MasterData.supplierCreate, body),
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/suppliers/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "supplier.read");
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.getSupplier(parsedParams.id);
  })
  .put("/api/v1/suppliers/:id", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "supplier.write");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.updateSupplier(
      parsedParams.id,
      parseBody(MasterData.supplierUpdate, body),
      getMutationActor(session, request),
    );
  })
  .delete("/api/v1/suppliers/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "supplier.write");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.deactivateSupplier(
      parsedParams.id,
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/customers", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "customer.read");

    return client.customers.list(query as Record<string, unknown>);
  })
  .get("/api/v1/customers/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "customer.read");
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.customers.get(parsedParams.id);
  })
  .get("/api/v1/users", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "user.read");
    requireRole(session, ["ADMIN"]);

    return client.users.list(query as Record<string, unknown>);
  })
  .post("/api/v1/users", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "user.write");
    requireRole(session, ["ADMIN"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.users.create(
      parseBody(Users.create, body),
      getMutationActor(session, request),
    );
  })
  .put("/api/v1/users/:id", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "user.write");
    requireRole(session, ["ADMIN"]);
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.users.update(
      parsedParams.id,
      parseBody(Users.update, body),
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/batches", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "batch.read");

    return client.medicines.listBatches(query as Record<string, unknown>);
  })
  .get("/api/v1/inventory/stock-sync", async ({ request }) => {
    const session = await requireSession(request);
    requirePermission(session, "batch.read");

    return client.inventory.getStockSyncWatermark();
  })
  .post("/api/v1/batches", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "batch.write");
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.medicines.createStockReceipt(
      parseBody(Inventory.stockReceipt, body),
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/batches/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "batch.read");
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.medicines.getBatch(parsedParams.id);
  })
  .post("/api/v1/batches/:id/adjust", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "stock_adjustment.write");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);
    const input = parseBody(Inventory.stockAdjustment, body);

    return client.medicines.adjustStock(
      { ...input, batchId: parsedParams.id },
      getMutationActor(session, request),
    );
  })
  .post("/api/v1/batches/:id/block", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "batch.write");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);
    const input = parseBody(Inventory.blockBatch, body);

    return client.medicines.blockBatch(
      parsedParams.id,
      input.reason,
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/stock-movements", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "stock_movement.read");

    return client.medicines.listStockMovements(query as Record<string, unknown>);
  })
  .get("/api/v1/orders", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "order.read");

    return client.orders.listOrders(query as Record<string, unknown>);
  })
  .get("/api/v1/orders/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "order.read");
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.orders.getOrderDetail(parsedParams.id);
  })
  .post("/api/v1/orders/:id/transition", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "order.process");
    assertSessionCsrf(request, session.csrfTokenHash);

    const input = parseBody(Orders.transition, body);

    return client.orders.transitionOrder({
      actorRole: session.user.role,
      actorUserId: session.userId,
      nextStatus: input.nextStatus,
      note: input.note,
      orderId: params.id,
      requestContext: getRequestContext(request),
    });
  })
  .get("/api/v1/payments", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "payment.read");

    return client.orders.listPayments(query as Record<string, unknown>);
  })
  .get("/api/v1/payments/:id", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "payment.read");
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.qrisSimulator.getPaymentDetail(parsedParams.id);
  })
  .post("/api/v1/payments/:id/initialize-qris", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "payment.read");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);
    const input = parseBody(Payments.initializeQris, body ?? {});

    return client.qrisSimulator.initializeQrisPayment(parsedParams.id, input.amount);
  })
  .post("/api/v1/payments/:id/override", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "payment.process");
    requireRole(session, ["ADMIN"]);
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);
    const input = parseBody(Payments.override, body);

    return client.orders.adminOverridePayment(
      parsedParams.id,
      input.overrideStatus,
      input.reason,
      session.userId,
    );
  })
  .post("/api/v1/payments/:id/simulate", async ({ body, params, request }) => {
    if (!ENV.enablePaymentSimulator) {
      throw new ForbiddenError("Simulator pembayaran tidak aktif.");
    }

    const session = await requireSession(request);
    requirePermission(session, "payment.read");
    requireRole(session, ["ADMIN", "CASHIER"]);
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);
    const input = parseBody(Payments.simulateCallback, body);

    await client.qrisSimulator.simulateCallback(
      parsedParams.id,
      input.outcome,
      getMutationActor(session, request),
    );

    return { ok: true };
  })
  .get("/api/v1/prescriptions", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "prescription.read");

    return client.orders.listPrescriptions(query as Record<string, unknown>);
  })
  .post("/api/v1/prescriptions/:id/review", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "prescription.verify");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.orders.reviewPrescription({
      ...getMutationActor(session, request),
      input: parseBody(Prescriptions.review, body),
      prescriptionId: parsedParams.id,
    });
  })
  .get("/api/v1/notifications", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "notification.read");

    return client.notifications.list(query as Record<string, unknown>, {
      role: session.user.role,
      userId: session.userId,
    });
  })
  .get("/api/v1/notifications/unread-count", async ({ request }) => {
    const session = await requireSession(request);
    requirePermission(session, "notification.read");

    const count = await client.notifications.getUnreadCount({
      role: session.user.role,
      userId: session.userId,
    });

    return { count };
  })
  .post("/api/v1/notifications/:id/read", async ({ params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "notification.read");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(Notifications.markReadParams, params);

    return client.notifications.markRead(parsedParams.id, {
      role: session.user.role,
      userId: session.userId,
    });
  })
  .post("/api/v1/notifications/read-all", async ({ request }) => {
    const session = await requireSession(request);
    requirePermission(session, "notification.read");
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.notifications.markAllRead(
      {
        role: session.user.role,
        userId: session.userId,
      },
      {
        requestContext: getRequestContext(request),
        role: session.user.role,
        userId: session.userId,
      },
    );
  })
  .post("/api/v1/notifications/scan-inventory", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "notification.read");
    requirePermission(session, "batch.read");
    requireRole(session, ["ADMIN", "PHARMACIST"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.notifications.scanInventoryAlerts(
      parseBody(Notifications.scanAlerts, body ?? {}),
      {
        requestContext: getRequestContext(request),
        role: session.user.role,
        userId: session.userId,
      },
    );
  })
  .get("/api/v1/reports", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "report.read");

    return client.reports.list(query as Record<string, unknown>);
  })
  .get("/api/v1/reports/:id/download", async ({ params, request, set }) => {
    const session = await requireSession(request);
    requirePermission(session, "report.read");
    const parsedParams = parseBody(MasterData.idParams, params);
    const file = await client.reports.getDownload(parsedParams.id);

    set.headers["Content-Type"] = file.contentType || "application/pdf";
    set.headers["Content-Disposition"] = `attachment; filename="${file.filename}"`;

    const body = new Uint8Array(file.bytes.byteLength);
    body.set(file.bytes);

    return new Response(body.buffer);
  })
  .post("/api/v1/reports", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "report.generate");
    assertSessionCsrf(request, session.csrfTokenHash);
    const input = parseBody(Reports.request, body);

    return client.reports.requestReport({
      actorRole: session.user.role,
      filters: input.filters,
      requesterUserId: session.userId,
      requestContext: getRequestContext(request),
      type: input.type,
    });
  })
  .get("/api/v1/imports", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "import.read");

    return client.imports.list(query as Record<string, unknown>);
  })
  .post("/api/v1/imports", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "import.run");
    assertSessionCsrf(request, session.csrfTokenHash);
    const input = parseBody(Imports.request, body);

    return client.imports.requestImport({
      actorRole: session.user.role,
      fileSizeBytes: input.fileSizeBytes,
      mapping: input.mapping,
      originalFileName: input.originalFileName,
      requesterUserId: session.userId,
      requestContext: getRequestContext(request),
      sourceFileObjectKey: input.sourceFileObjectKey,
      type: input.type,
    });
  })
  .get("/api/v1/imports/:id/rows", async ({ params, request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "import.read");

    return client.imports.listRows(params.id, query as Record<string, unknown>);
  })
  .get("/api/v1/jobs", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "monitoring.read");

    return client.jobs.list(query as Record<string, unknown>);
  })
  .get("/api/v1/error-logs", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "error_log.read");

    return client.jobs.listErrors(query as Record<string, unknown>);
  })
  .post("/api/v1/error-logs", async ({ body, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "error_log.read");
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.jobs.recordError(
      parseBody(ErrorLogs.record, body),
      getMutationActor(session, request),
    );
  })
  .post("/api/v1/error-logs/:id/resolve", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "error_log.read");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.jobs.resolveError(
      parsedParams.id,
      parseBody(ErrorLogs.resolution, body),
      getMutationActor(session, request),
    );
  })
  .post("/api/v1/error-logs/:id/ignore", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requirePermission(session, "error_log.read");
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);

    return client.jobs.ignoreError(
      parsedParams.id,
      parseBody(ErrorLogs.resolution, body),
      getMutationActor(session, request),
    );
  })
  .get("/api/v1/monitoring", async ({ request }) => {
    const session = await requireSession(request);
    requirePermission(session, "monitoring.read");

    return client.jobs.getMonitoringOverview();
  })
  .get("/api/v1/audit-logs", async ({ request, query }) => {
    const session = await requireSession(request);
    requirePermission(session, "audit_log.read");

    return client.auditLogs.list(query as Record<string, unknown>);
  })
  .get("/api/v1/account/orders", async ({ request, query }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);

    const result = await client.orders.listOrders({
      ...(query as Record<string, unknown>),
      customerUserId: session.userId,
    });

    // Surface pending payment info for AWAITING_PAYMENT orders so the customer
    // can navigate directly to the payment page after prescription approval.
    const awaitingIds = result.data
      .filter((o) => o.status === "AWAITING_PAYMENT")
      .map((o) => o.id);

    const pendingPayments = await client.orders.getOrderPendingPayments(
      awaitingIds,
      session.userId,
    );

    const paymentByOrderId = Object.fromEntries(
      pendingPayments.map((p) => [p.orderId, { id: p.id, method: p.method }]),
    );

    return {
      ...result,
      data: result.data.map((order) => ({
        ...order,
        pendingPayment: paymentByOrderId[order.id] ?? null,
      })),
    };
  })
  .get("/api/v1/account/prescriptions", async ({ request, query }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);

    return client.orders.listPrescriptions({
      ...(query as Record<string, unknown>),
      customerUserId: session.userId,
    });
  })
  .get("/api/v1/cart", async ({ request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);

    return client.cart.getCart(session.userId);
  })
  .post("/api/v1/cart/items", async ({ body, request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    const input = parseBody(Cart.addItem, body);

    return client.cart.addItem(session.userId, input.medicineId, input.quantity);
  })
  .put("/api/v1/cart/items/:itemId", async ({ body, params, request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    const parsedParams = parseBody(Cart.itemParams, params);
    const input = parseBody(Cart.updateItem, body);

    return client.cart.updateItem(session.userId, parsedParams.itemId, input.quantity);
  })
  .delete("/api/v1/cart/items/:itemId", async ({ params, request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    const parsedParams = parseBody(Cart.itemParams, params);

    return client.cart.removeItem(session.userId, parsedParams.itemId);
  })
  .delete("/api/v1/cart", async ({ request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    return client.cart.clearCart(session.userId);
  })
  .post("/api/v1/checkout", async ({ body, request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    const input = parseBody(Cart.checkout, body);

    return client.cart.createCheckout(
      session.userId,
      input.paymentMethod,
      input.fulfillmentMethod,
      input.idempotencyKey,
    );
  })
  .post("/api/v1/orders/:id/prescription", async ({ params, request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);
    assertSessionCsrf(request, session.csrfTokenHash);
    const parsedParams = parseBody(MasterData.idParams, params);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ValidationAppError("File resep wajib diunggah.");
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    return client.cart.submitPrescription(session.userId, {
      bytes,
      contentType: file.type || "application/octet-stream",
      fileName: file.name || "resep",
      orderId: parsedParams.id,
      requestContext: getRequestContext(request),
      sizeBytes: file.size,
    });
  })
  .post("/api/v1/cashier/checkout", async ({ body, request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CASHIER", "ADMIN"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    const input = parseBody(Orders.cashierCheckout, body);

    return client.orders.createCashierOrder(input, getMutationActor(session, request));
  })
  .post("/api/v1/cart/merge", async ({ body, request }) => {
    const session = await requireSession(request);
    requireRole(session, ["CUSTOMER"]);
    assertSessionCsrf(request, session.csrfTokenHash);

    const input = parseBody(Cart.merge, body);

    return client.cart.mergeLocalCart(session.userId, input.items);
  });
