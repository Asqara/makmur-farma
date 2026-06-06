"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Loader2,
  Package,
  PackageCheck,
  Truck,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  ActionMenu,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  OrderStatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextareaInput,
  toast,
} from "@/components/ui";
import type { OrderChannel, OrderStatus } from "@/constants/domain";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
} from "@/constants/domain";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime } from "@/utils/inventoryDisplay";

type TransitionTarget = {
  id: string;
  nextStatus: OrderStatus;
  note: string;
} | null;

type OrdersResponse = {
  data: Array<{
    channel: OrderChannel;
    createdAt: Date | string;
    customer: {
      email: string | null;
      name: string | null;
    };
    grandTotal: string;
    id: string;
    itemCount: number;
    orderNumber: string;
    prescriptionRequired: boolean;
    status: OrderStatus;
  }>;
};

const TRANSITION_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  CANCELLED: "Batalkan Pesanan",
  COMPLETED: "Selesaikan",
  PAID: "Konfirmasi Pembayaran",
  PROCESSING: "Proses Pesanan",
  READY_FOR_PICKUP: "Siap Diambil",
  SHIPPED: "Kirim",
};

const TRANSITION_ACTION_ICONS: Partial<Record<OrderStatus, ReactNode>> = {
  CANCELLED: <X />,
  COMPLETED: <CheckCircle />,
  PAID: <CheckCircle />,
  PROCESSING: <Package />,
  READY_FOR_PICKUP: <PackageCheck />,
  SHIPPED: <Truck />,
};

const TRANSITION_CONFIRM_LABELS: Partial<Record<OrderStatus, string>> = {
  CANCELLED: "Ya, Batalkan",
  COMPLETED: "Ya, Selesaikan",
  PAID: "Ya, Konfirmasi",
  PROCESSING: "Ya, Proses",
  READY_FOR_PICKUP: "Ya, Siap Diambil",
  SHIPPED: "Ya, Kirim",
};

const TRANSITION_DESCRIPTIONS: Partial<Record<OrderStatus, string>> = {
  CANCELLED: "Pesanan akan dibatalkan dan stok yang direservasi akan dilepas.",
  COMPLETED: "Pesanan akan ditandai selesai.",
  PAID: "Tandai pembayaran pesanan ini sebagai lunas secara manual.",
  PROCESSING: "Pesanan akan mulai diproses.",
  READY_FOR_PICKUP: "Pesanan akan ditandai siap diambil oleh pelanggan.",
  SHIPPED: "Pesanan akan ditandai telah dikirim.",
};

/**
 * Returns only the transition targets that are exposed as manual UI actions.
 */
function getManualTransitions(status: OrderStatus): OrderStatus[] {
  const allowed = ORDER_STATUS_TRANSITIONS[status] ?? [];

  return allowed.filter((s) => s in TRANSITION_ACTION_LABELS);
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<TransitionTarget>(null);

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.orders.get({
        query: { limit: "30", page: "1", sortBy: "createdAt", sortDir: "desc" },
      });

      if (response.error) throw response.error;

      return response.data as OrdersResponse;
    },
    queryKey: ["orders"],
  });

  const transitionMutation = useMutation({
    mutationFn: async ({
      id,
      nextStatus,
      note,
    }: {
      id: string;
      nextStatus: OrderStatus;
      note?: string;
    }) => {
      const response = await eden.api.v1.orders({ id }).transition.post(
        { nextStatus, note: note || undefined },
      );

      if (response.error) throw response.error;

      return response.data;
    },
    onError: (error: unknown) => {
      const message =
        (error as { message?: string })?.message ?? "Transisi status pesanan gagal. Coba lagi.";
      toast.error(message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setTarget(null);
      toast.success(
        `Status pesanan berhasil diubah ke "${ORDER_STATUS_LABELS[variables.nextStatus]}".`,
      );
    },
  });

  const isCancel = target?.nextStatus === "CANCELLED";
  const confirmVariant = isCancel ? "danger" : "info";
  const confirmDescription = target
    ? (TRANSITION_DESCRIPTIONS[target.nextStatus] ?? "Lanjutkan perubahan status pesanan ini?")
    : "";

  return (
    <DataTableShell
      description="Pesanan online dan kasir memakai workflow dan stok yang sama."
      title="Pesanan"
    >
      {query.isError ? (
        <ErrorState
          description="Pesanan gagal dimuat."
          onRetry={() => query.refetch()}
          title="Pesanan Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Resep</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((order) => {
                  const manualTransitions = getManualTransitions(order.status);

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-text-strong">
                          {order.customer.name ?? "Pelanggan umum"}
                        </p>
                        <p className="ts-xs text-text-muted">
                          {order.customer.email ?? "-"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={order.channel === "ONLINE" ? "info" : "primary"}
                        >
                          {order.channel === "ONLINE" ? "Online" : "Kasir"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          tone={
                            order.prescriptionRequired ? "warning" : "success"
                          }
                        >
                          {order.prescriptionRequired ? "Perlu Resep" : "Tidak"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell>{order.itemCount}</TableCell>
                      <TableCell>{formatRp(Number(order.grandTotal))}</TableCell>
                      <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                      <TableCell>
                        <ActionMenu
                          items={[
                            {
                              href: ROUTES.ORDERS.DETAIL(order.id),
                              label: "Lihat Detail",
                            },
                            {
                              disabled: true,
                              label: "──────────",
                            },
                            ...manualTransitions.map((nextStatus) => ({
                              icon: TRANSITION_ACTION_ICONS[nextStatus],
                              label:
                                TRANSITION_ACTION_LABELS[nextStatus] ??
                                nextStatus,
                              onSelect: () =>
                                setTarget({
                                  id: order.id,
                                  nextStatus,
                                  note: "",
                                }),
                            })),
                          ]}
                          label={`Aksi untuk ${order.orderNumber}`}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={
            query.isLoading ? "Memuat pesanan..." : "Belum ada pesanan."
          }
          title={query.isLoading ? "Memuat" : "Pesanan Kosong"}
        />
      )}

      {/* Transition confirmation dialog */}
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel={
          target
            ? (TRANSITION_CONFIRM_LABELS[target.nextStatus] ?? "Konfirmasi")
            : "Konfirmasi"
        }
        description={
          isCancel && target
            ? target.note
              ? `${confirmDescription} Alasan: ${target.note}`
              : confirmDescription
            : confirmDescription
        }
        id="order-transition-dialog"
        loading={transitionMutation.isPending}
        onCancel={() => {
          setTarget(null);
          transitionMutation.reset();
        }}
        onConfirm={() => {
          if (!target) return;

          transitionMutation.mutate({
            id: target.id,
            nextStatus: target.nextStatus,
            note: target.note || undefined,
          });
        }}
        open={target !== null && !isCancel}
        title={
          target
            ? `${TRANSITION_ACTION_LABELS[target.nextStatus] ?? "Ubah Status"}`
            : "Ubah Status Pesanan"
        }
        variant={confirmVariant}
      />

      {/* Cancel dialog with reason textarea */}
      {target && isCancel && (
        <section className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-primary-navy/50 p-3 sm:p-4">
          <section
            aria-labelledby="cancel-dialog-title"
            aria-modal="true"
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-border-default bg-card-surface shadow-lg"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border-default px-4 py-4 sm:px-6">
              <h2
                className="ts-lg font-semibold text-text-strong"
                id="cancel-dialog-title"
              >
                Batalkan Pesanan
              </h2>
            </header>
            <section className="grid gap-4 p-4 sm:p-6">
              <p className="ts-sm text-text-default">
                Pesanan akan dibatalkan dan stok yang direservasi akan dilepas.
                Tindakan ini tidak dapat dibatalkan.
              </p>
              <TextareaInput
                id="cancel-note"
                label="Alasan Pembatalan"
                onChange={(e) =>
                  setTarget((prev) =>
                    prev ? { ...prev, note: e.target.value } : null,
                  )
                }
                placeholder="Tulis alasan pembatalan pesanan (opsional)..."
                rows={3}
                value={target.note}
              />
            </section>
            <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border-default px-4 py-4 sm:px-6">
              <Button
                disabled={transitionMutation.isPending}
                onClick={() => {
                  setTarget(null);
                  transitionMutation.reset();
                }}
                variant="secondary"
              >
                Batal
              </Button>
              <Button
                disabled={transitionMutation.isPending}
                leftIcon={
                  transitionMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : undefined
                }
                onClick={() => {
                  transitionMutation.mutate({
                    id: target.id,
                    nextStatus: target.nextStatus,
                    note: target.note || undefined,
                  });
                }}
                variant="danger"
              >
                Ya, Batalkan
              </Button>
            </footer>
          </section>
        </section>
      )}
    </DataTableShell>
  );
}
