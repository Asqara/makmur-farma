import "server-only";

import { and, eq, sql } from "drizzle-orm";

import {
  cartItems,
  carts,
  medicines,
  medicineCategories,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
} from "@/drizzle-schema";
import { db, readDb } from "@/lib/db";
import {
  ForbiddenError,
  NotFoundAppError,
  ValidationAppError,
} from "@/lib/errors";
import type { PaymentMethod } from "@/constants/domain";

import { calculateOrderTotals } from "./order-rules";

export type CartItemDetail = {
  cartId: string;
  id: string;
  medicine: {
    id: string;
    name: string;
    prescriptionRequired: boolean;
    sellingPrice: string;
    totalAvailable: number;
    unit: string;
  };
  quantity: number;
};

export type CartDetail = {
  id: string;
  items: CartItemDetail[];
  status: string;
};

export type CheckoutResult = {
  order: {
    grandTotal: string;
    id: string;
    orderNumber: string;
    prescriptionRequired: boolean;
    status: string;
    subtotal: string;
  };
  payment: {
    amount: string;
    id: string;
    method: string;
    status: string;
  };
};

/**
 * Cart and checkout business logic. All operations enforce customer ownership.
 */
export class CartClient {
  /**
   * Gets or creates the active cart for a customer, returning it with item details.
   */
  async getCart(userId: string): Promise<CartDetail> {
    const cart = await this.ensureActiveCart(userId);

    const rows = await readDb
      .select({
        cartId: cartItems.cartId,
        itemId: cartItems.id,
        medicineId: medicines.id,
        medicineName: medicines.name,
        prescriptionRequired: medicines.prescriptionRequired,
        quantity: cartItems.quantity,
        sellingPrice: medicines.sellingPrice,
        totalAvailable: sql<number>`coalesce((
          select sum(mb.available_quantity)
          from medicine_batches mb
          where mb.medicine_id = ${medicines.id}
        ), 0)`,
        unit: medicines.unit,
      })
      .from(cartItems)
      .innerJoin(medicines, eq(cartItems.medicineId, medicines.id))
      .where(eq(cartItems.cartId, cart.id));

    return {
      id: cart.id,
      items: rows.map((row) => ({
        cartId: row.cartId,
        id: row.itemId,
        medicine: {
          id: row.medicineId,
          name: row.medicineName,
          prescriptionRequired: row.prescriptionRequired,
          sellingPrice: row.sellingPrice,
          totalAvailable: Number(row.totalAvailable ?? 0),
          unit: row.unit,
        },
        quantity: row.quantity,
      })),
      status: cart.status,
    };
  }

  /**
   * Adds a medicine to the cart. Merges quantities if already present.
   */
  async addItem(
    userId: string,
    medicineId: string,
    quantity: number,
  ): Promise<CartDetail> {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationAppError("Jumlah harus berupa bilangan bulat positif.");
    }

    const [medicine] = await readDb
      .select({
        id: medicines.id,
        status: medicines.status,
      })
      .from(medicines)
      .where(eq(medicines.id, medicineId))
      .limit(1);

    if (!medicine) {
      throw new NotFoundAppError("Obat tidak ditemukan.");
    }

    if (medicine.status !== "ACTIVE") {
      throw new ValidationAppError("Obat tidak tersedia untuk pembelian.");
    }

    const cart = await this.ensureActiveCart(userId);

    const [existing] = await readDb
      .select({ id: cartItems.id, quantity: cartItems.quantity })
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.medicineId, medicineId),
        ),
      )
      .limit(1);

    if (existing) {
      await db
        .update(cartItems)
        .set({
          quantity: existing.quantity + quantity,
          updatedAt: new Date(),
        })
        .where(eq(cartItems.id, existing.id));
    } else {
      await db.insert(cartItems).values({
        cartId: cart.id,
        medicineId,
        quantity,
      });
    }

    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    return this.getCart(userId);
  }

  /**
   * Updates the quantity of a specific cart item. Validates ownership.
   */
  async updateItem(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartDetail> {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationAppError("Jumlah harus berupa bilangan bulat positif.");
    }

    const item = await this.requireOwnedCartItem(userId, cartItemId);

    await db
      .update(cartItems)
      .set({ quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, item.id));

    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, item.cartId));

    return this.getCart(userId);
  }

  /**
   * Removes a single item from the cart. Validates ownership.
   */
  async removeItem(userId: string, cartItemId: string): Promise<CartDetail> {
    const item = await this.requireOwnedCartItem(userId, cartItemId);

    await db.delete(cartItems).where(eq(cartItems.id, item.id));

    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, item.cartId));

    return this.getCart(userId);
  }

  /**
   * Removes all items from the customer's active cart.
   */
  async clearCart(userId: string): Promise<CartDetail> {
    const cart = await this.ensureActiveCart(userId);

    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    await db
      .update(carts)
      .set({ updatedAt: new Date() })
      .where(eq(carts.id, cart.id));

    return this.getCart(userId);
  }

  /**
   * Merges items from local storage (provided by client) into the customer's active cart.
   * If a medicine already exists in the cart, the quantity is added.
   */
  async mergeLocalCart(
    userId: string,
    items: Array<{ medicineId: string; quantity: number }>,
  ): Promise<CartDetail> {
    if (items.length === 0) {
      return this.getCart(userId);
    }

    const cart = await this.ensureActiveCart(userId);

    await db.transaction(async (tx) => {
      for (const item of items) {
        if (!Number.isInteger(item.quantity) || item.quantity < 1) continue;

        const [medicine] = await tx
          .select({ id: medicines.id })
          .from(medicines)
          .where(and(eq(medicines.id, item.medicineId), eq(medicines.status, "ACTIVE")))
          .limit(1);

        if (!medicine) continue;

        const [existing] = await tx
          .select({ id: cartItems.id, quantity: cartItems.quantity })
          .from(cartItems)
          .where(
            and(
              eq(cartItems.cartId, cart.id),
              eq(cartItems.medicineId, item.medicineId),
            ),
          )
          .limit(1);

        if (existing) {
          await tx
            .update(cartItems)
            .set({
              quantity: existing.quantity + item.quantity,
              updatedAt: new Date(),
            })
            .where(eq(cartItems.id, existing.id));
        } else {
          await tx.insert(cartItems).values({
            cartId: cart.id,
            medicineId: item.medicineId,
            quantity: item.quantity,
          });
        }
      }

      await tx
        .update(carts)
        .set({ updatedAt: new Date() })
        .where(eq(carts.id, cart.id));
    });

    return this.getCart(userId);
  }

  /**
   * Creates an order from the customer's active cart.
   * Prices are always re-fetched from the database — never trusted from the cart.
   * Stock reservation happens in the background worker after the order is created.
   */
  async createCheckout(
    userId: string,
    paymentMethod: PaymentMethod,
    fulfillmentMethod: string,
    idempotencyKey: string,
  ): Promise<CheckoutResult> {
    const [existingOrder] = await readDb
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existingOrder) {
      const [existingPayment] = await readDb
        .select({
          amount: payments.amount,
          id: payments.id,
          method: payments.method,
          status: payments.status,
        })
        .from(payments)
        .where(eq(payments.orderId, existingOrder.id))
        .limit(1);

      const [orderRow] = await readDb
        .select({
          grandTotal: orders.grandTotal,
          id: orders.id,
          orderNumber: orders.orderNumber,
          prescriptionRequired: orders.prescriptionRequired,
          status: orders.status,
          subtotal: orders.subtotal,
        })
        .from(orders)
        .where(eq(orders.id, existingOrder.id))
        .limit(1);

      if (orderRow && existingPayment) {
        return {
          order: {
            grandTotal: orderRow.grandTotal,
            id: orderRow.id,
            orderNumber: orderRow.orderNumber,
            prescriptionRequired: orderRow.prescriptionRequired,
            status: orderRow.status,
            subtotal: orderRow.subtotal,
          },
          payment: {
            amount: existingPayment.amount,
            id: existingPayment.id,
            method: existingPayment.method,
            status: existingPayment.status,
          },
        };
      }
    }

    const cart = await this.ensureActiveCart(userId);

    const itemRows = await readDb
      .select({
        cartItemId: cartItems.id,
        medicineId: medicines.id,
        medicineName: medicines.name,
        prescriptionRequired: medicines.prescriptionRequired,
        quantity: cartItems.quantity,
        sellingPrice: medicines.sellingPrice,
        status: medicines.status,
      })
      .from(cartItems)
      .innerJoin(medicines, eq(cartItems.medicineId, medicines.id))
      .where(eq(cartItems.cartId, cart.id));

    if (itemRows.length === 0) {
      throw new ValidationAppError("Keranjang kosong. Tambahkan obat terlebih dahulu.");
    }

    for (const item of itemRows) {
      if (item.status !== "ACTIVE") {
        throw new ValidationAppError(
          `Obat "${item.medicineName}" tidak lagi tersedia. Hapus dari keranjang sebelum melanjutkan.`,
        );
      }
    }

    const lines = itemRows.map((item) => ({
      prescriptionRequired: item.prescriptionRequired,
      quantity: item.quantity,
      unitPrice: item.sellingPrice,
    }));

    const totals = calculateOrderTotals(lines);

    const now = new Date();
    const orderNumber = `ONL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const initialStatus = totals.prescriptionRequired
      ? "AWAITING_PRESCRIPTION"
      : "AWAITING_PAYMENT";
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const paymentExpiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          channel: "ONLINE",
          customerUserId: userId,
          discountTotal: totals.discountTotal,
          expiresAt,
          fulfillmentMethod,
          grandTotal: totals.grandTotal,
          idempotencyKey,
          orderNumber,
          prescriptionRequired: totals.prescriptionRequired,
          status: initialStatus,
          subtotal: totals.subtotal,
          taxTotal: totals.taxTotal,
        })
        .returning();

      await tx.insert(orderItems).values(
        itemRows.map((item) => ({
          medicineId: item.medicineId,
          orderId: newOrder.id,
          prescriptionRequired: item.prescriptionRequired,
          quantity: item.quantity,
          subtotal: (
            Math.round(Number(item.sellingPrice) * 100 * item.quantity) / 100
          ).toFixed(2),
          unitPrice: item.sellingPrice,
        })),
      );

      await tx.insert(orderStatusHistory).values({
        fromStatus: null,
        metadata: { channel: "ONLINE", source: "checkout" },
        note: "Pesanan dibuat melalui checkout online.",
        orderId: newOrder.id,
        toStatus: initialStatus,
      });

      const [newPayment] = await tx
        .insert(payments)
        .values({
          amount: totals.grandTotal,
          expiresAt: paymentExpiresAt,
          idempotencyKey,
          method: paymentMethod,
          orderId: newOrder.id,
          provider: "manual",
          status: "PENDING",
        })
        .returning();

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      await tx
        .update(carts)
        .set({
          convertedOrderId: newOrder.id,
          status: "CONVERTED",
          updatedAt: now,
        })
        .where(eq(carts.id, cart.id));

      return {
        order: {
          grandTotal: newOrder.grandTotal,
          id: newOrder.id,
          orderNumber: newOrder.orderNumber,
          prescriptionRequired: newOrder.prescriptionRequired,
          status: newOrder.status,
          subtotal: newOrder.subtotal,
        },
        payment: {
          amount: newPayment.amount,
          id: newPayment.id,
          method: newPayment.method,
          status: newPayment.status,
        },
      };
    });
  }

  private async ensureActiveCart(userId: string) {
    const [existing] = await readDb
      .select({ id: carts.id, status: carts.status })
      .from(carts)
      .where(
        and(eq(carts.customerUserId, userId), eq(carts.status, "ACTIVE")),
      )
      .limit(1);

    if (existing) return existing;

    const [created] = await db
      .insert(carts)
      .values({ customerUserId: userId, status: "ACTIVE" })
      .returning({ id: carts.id, status: carts.status });

    return created;
  }

  private async requireOwnedCartItem(userId: string, cartItemId: string) {
    const [item] = await readDb
      .select({
        cartId: cartItems.cartId,
        id: cartItems.id,
        ownerUserId: carts.customerUserId,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .innerJoin(carts, eq(cartItems.cartId, carts.id))
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (!item) {
      throw new NotFoundAppError("Item keranjang tidak ditemukan.");
    }

    if (item.ownerUserId !== userId) {
      throw new ForbiddenError("Anda tidak memiliki akses ke item ini.");
    }

    return item;
  }
}
