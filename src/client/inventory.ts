import { and, asc, desc, eq, gt, gte, isNull, sql } from "drizzle-orm";

import {
  medicineBatches,
  orderItems,
  stockMovements,
  stockReservations,
} from "@/drizzle-schema";
import { db, readDb, type DbTransaction } from "@/lib/db";

type InventoryActor = {
  actorUserId?: string | null;
};

type ReservationOptions = InventoryActor & {
  expiresAt?: Date;
};

type StockMutationTx = DbTransaction;

const DEFAULT_RESERVATION_TTL_MS = 24 * 60 * 60 * 1000;

export class InventoryStockError extends Error {
  code = "INSUFFICIENT_STOCK";
  publicMessage: string;
  statusCode = 409;

  constructor(publicMessage = "Stok tidak mencukupi.") {
    super(publicMessage);
    this.publicMessage = publicMessage;
  }
}

/**
 * Shared batch-stock workflow for online checkout, cashier sales, payment
 * finalization, and reservation expiry.
 */
export class InventoryWorkflowClient {
  async getStockSyncWatermark() {
    const [latestMovement] = await readDb
      .select({
        id: stockMovements.id,
        timestamp: stockMovements.createdAt,
      })
      .from(stockMovements)
      .orderBy(desc(stockMovements.createdAt), desc(stockMovements.id))
      .limit(1);

    return {
      latestMovementAt: latestMovement?.timestamp ?? null,
      latestMovementId: latestMovement?.id ?? null,
    };
  }

  async reserveOrderStock(orderId: string, options: ReservationOptions = {}) {
    return db.transaction((tx) => this.reserveOrderStockTx(tx, orderId, options));
  }

  async fulfillOrderReservations(orderId: string, actor: InventoryActor = {}) {
    return db.transaction((tx) =>
      this.fulfillOrderReservationsTx(tx, orderId, actor),
    );
  }

  async releaseOrderReservations(
    orderId: string,
    reason = "Reservasi stok dilepas.",
    actor: InventoryActor = {},
  ) {
    return db.transaction((tx) =>
      this.releaseOrderReservationsTx(tx, orderId, reason, actor),
    );
  }

  async recordCounterSale(orderId: string, actor: InventoryActor = {}) {
    return db.transaction((tx) => this.recordCounterSaleTx(tx, orderId, actor));
  }

  async reserveOrderStockTx(
    tx: StockMutationTx,
    orderId: string,
    options: ReservationOptions = {},
  ) {
    const existingActive = await tx
      .select({ id: stockReservations.id })
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.orderId, orderId),
          isNull(stockReservations.releasedAt),
          isNull(stockReservations.fulfilledAt),
        ),
      )
      .limit(1);

    if (existingActive.length > 0) {
      return { reserved: 0 };
    }

    const items = await tx
      .select({
        id: orderItems.id,
        medicineId: orderItems.medicineId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    let reserved = 0;
    const expiresAt =
      options.expiresAt ?? new Date(Date.now() + DEFAULT_RESERVATION_TTL_MS);

    for (const item of items) {
      let remaining = item.quantity;

      while (remaining > 0) {
        const [candidate] = await tx
          .select({
            availableQuantity: medicineBatches.availableQuantity,
            batchId: medicineBatches.id,
            medicineId: medicineBatches.medicineId,
            reservedQuantity: medicineBatches.reservedQuantity,
          })
          .from(medicineBatches)
          .where(
            and(
              eq(medicineBatches.medicineId, item.medicineId),
              eq(medicineBatches.status, "AVAILABLE"),
              gt(medicineBatches.availableQuantity, 0),
              gt(medicineBatches.expiryDate, new Date()),
            ),
          )
          .orderBy(
            asc(medicineBatches.expiryDate),
            asc(medicineBatches.receivedDate),
            asc(medicineBatches.id),
          )
          .limit(1);

        if (!candidate) {
          throw new InventoryStockError(
            "Stok batch yang memenuhi syarat tidak mencukupi.",
          );
        }

        const quantity = Math.min(remaining, candidate.availableQuantity);
        const [updatedBatch] = await tx
          .update(medicineBatches)
          .set({
            availableQuantity: sql`${medicineBatches.availableQuantity} - ${quantity}`,
            reservedQuantity: sql`${medicineBatches.reservedQuantity} + ${quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(medicineBatches.id, candidate.batchId),
              eq(medicineBatches.status, "AVAILABLE"),
              gte(medicineBatches.availableQuantity, quantity),
            ),
          )
          .returning({
            availableQuantity: medicineBatches.availableQuantity,
            reservedQuantity: medicineBatches.reservedQuantity,
          });

        if (!updatedBatch) {
          continue;
        }

        await tx.insert(stockReservations).values({
          batchId: candidate.batchId,
          expiresAt,
          medicineId: item.medicineId,
          orderId,
          orderItemId: item.id,
          quantity,
        });

        await tx.insert(stockMovements).values({
          actorUserId: options.actorUserId ?? null,
          availableAfter: updatedBatch.availableQuantity,
          availableBefore: updatedBatch.availableQuantity + quantity,
          batchId: candidate.batchId,
          medicineId: item.medicineId,
          quantityDelta: -quantity,
          reason: "Reservasi stok untuk pesanan.",
          referenceId: orderId,
          referenceType: "ORDER",
          reservedAfter: updatedBatch.reservedQuantity,
          reservedBefore: updatedBatch.reservedQuantity - quantity,
          type: "RESERVATION",
        });

        remaining -= quantity;
        reserved += quantity;
      }
    }

    return { reserved };
  }

  async fulfillOrderReservationsTx(
    tx: StockMutationTx,
    orderId: string,
    actor: InventoryActor = {},
  ) {
    const reservations = await tx
      .select({
        batchId: stockReservations.batchId,
        id: stockReservations.id,
        medicineId: stockReservations.medicineId,
        quantity: stockReservations.quantity,
      })
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.orderId, orderId),
          isNull(stockReservations.releasedAt),
          isNull(stockReservations.fulfilledAt),
        ),
      );

    let fulfilled = 0;

    for (const reservation of reservations) {
      const [updatedBatch] = await tx
        .update(medicineBatches)
        .set({
          reservedQuantity: sql`${medicineBatches.reservedQuantity} - ${reservation.quantity}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(medicineBatches.id, reservation.batchId),
            gte(medicineBatches.reservedQuantity, reservation.quantity),
          ),
        )
        .returning({
          availableQuantity: medicineBatches.availableQuantity,
          reservedQuantity: medicineBatches.reservedQuantity,
        });

      if (!updatedBatch) {
        continue;
      }

      await tx
        .update(stockReservations)
        .set({ fulfilledAt: new Date(), updatedAt: new Date() })
        .where(eq(stockReservations.id, reservation.id));

      await tx.insert(stockMovements).values({
        actorUserId: actor.actorUserId ?? null,
        availableAfter: updatedBatch.availableQuantity,
        availableBefore: updatedBatch.availableQuantity,
        batchId: reservation.batchId,
        medicineId: reservation.medicineId,
        quantityDelta: -reservation.quantity,
        reason: "Stok terjual setelah pembayaran terverifikasi.",
        referenceId: orderId,
        referenceType: "ORDER",
        reservedAfter: updatedBatch.reservedQuantity,
        reservedBefore: updatedBatch.reservedQuantity + reservation.quantity,
        type: "SALE",
      });

      fulfilled += reservation.quantity;
    }

    return { fulfilled };
  }

  async releaseOrderReservationsTx(
    tx: StockMutationTx,
    orderId: string,
    reason = "Reservasi stok dilepas.",
    actor: InventoryActor = {},
  ) {
    const reservations = await tx
      .select({
        batchId: stockReservations.batchId,
        id: stockReservations.id,
        medicineId: stockReservations.medicineId,
        quantity: stockReservations.quantity,
      })
      .from(stockReservations)
      .where(
        and(
          eq(stockReservations.orderId, orderId),
          isNull(stockReservations.releasedAt),
          isNull(stockReservations.fulfilledAt),
        ),
      );

    let released = 0;

    for (const reservation of reservations) {
      const [updatedBatch] = await tx
        .update(medicineBatches)
        .set({
          availableQuantity: sql`${medicineBatches.availableQuantity} + ${reservation.quantity}`,
          reservedQuantity: sql`${medicineBatches.reservedQuantity} - ${reservation.quantity}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(medicineBatches.id, reservation.batchId),
            gte(medicineBatches.reservedQuantity, reservation.quantity),
          ),
        )
        .returning({
          availableQuantity: medicineBatches.availableQuantity,
          reservedQuantity: medicineBatches.reservedQuantity,
        });

      if (!updatedBatch) {
        continue;
      }

      await tx
        .update(stockReservations)
        .set({ releasedAt: new Date(), updatedAt: new Date() })
        .where(eq(stockReservations.id, reservation.id));

      await tx.insert(stockMovements).values({
        actorUserId: actor.actorUserId ?? null,
        availableAfter: updatedBatch.availableQuantity,
        availableBefore: updatedBatch.availableQuantity - reservation.quantity,
        batchId: reservation.batchId,
        medicineId: reservation.medicineId,
        quantityDelta: reservation.quantity,
        reason,
        referenceId: orderId,
        referenceType: "ORDER",
        reservedAfter: updatedBatch.reservedQuantity,
        reservedBefore: updatedBatch.reservedQuantity + reservation.quantity,
        type: "RESERVATION_RELEASE",
      });

      released += reservation.quantity;
    }

    return { released };
  }

  async recordCounterSaleTx(
    tx: StockMutationTx,
    orderId: string,
    actor: InventoryActor = {},
  ) {
    const items = await tx
      .select({
        medicineId: orderItems.medicineId,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));

    let sold = 0;

    for (const item of items) {
      let remaining = item.quantity;

      while (remaining > 0) {
        const [candidate] = await tx
          .select({
            availableQuantity: medicineBatches.availableQuantity,
            batchId: medicineBatches.id,
            reservedQuantity: medicineBatches.reservedQuantity,
          })
          .from(medicineBatches)
          .where(
            and(
              eq(medicineBatches.medicineId, item.medicineId),
              eq(medicineBatches.status, "AVAILABLE"),
              gt(medicineBatches.availableQuantity, 0),
              gt(medicineBatches.expiryDate, new Date()),
            ),
          )
          .orderBy(
            asc(medicineBatches.expiryDate),
            asc(medicineBatches.receivedDate),
            asc(medicineBatches.id),
          )
          .limit(1);

        if (!candidate) {
          throw new InventoryStockError(
            "Stok batch yang memenuhi syarat tidak mencukupi.",
          );
        }

        const quantity = Math.min(remaining, candidate.availableQuantity);
        const [updatedBatch] = await tx
          .update(medicineBatches)
          .set({
            availableQuantity: sql`${medicineBatches.availableQuantity} - ${quantity}`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(medicineBatches.id, candidate.batchId),
              eq(medicineBatches.status, "AVAILABLE"),
              gte(medicineBatches.availableQuantity, quantity),
            ),
          )
          .returning({
            availableQuantity: medicineBatches.availableQuantity,
            reservedQuantity: medicineBatches.reservedQuantity,
          });

        if (!updatedBatch) {
          continue;
        }

        await tx.insert(stockMovements).values({
          actorUserId: actor.actorUserId ?? null,
          availableAfter: updatedBatch.availableQuantity,
          availableBefore: updatedBatch.availableQuantity + quantity,
          batchId: candidate.batchId,
          medicineId: item.medicineId,
          quantityDelta: -quantity,
          reason: "Penjualan langsung kasir.",
          referenceId: orderId,
          referenceType: "ORDER",
          reservedAfter: updatedBatch.reservedQuantity,
          reservedBefore: updatedBatch.reservedQuantity,
          type: "SALE",
        });

        remaining -= quantity;
        sold += quantity;
      }
    }

    return { sold };
  }
}
