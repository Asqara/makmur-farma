"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  Package,
  PackageCheck,
  Truck,
  X,
} from "lucide-react";
import { use, useState } from "react";

import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ConfirmDialog,
  DataTable,
  EmptyState,
  ErrorState,
  OrderStatusBadge,
  StatusBadge,
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
  ORDER_CHANNEL_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_METHOD_VALUES,
  PAYMENT_STATUS_LABELS,
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_TONES,
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

type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number];

type OrderDetailResponse = {
  channel: OrderChannel;
  createdAt: Date | string;
  customer: {
    email: string | null;
    id: string | null;
    name: string | null;
  };
  grandTotal: string;
  id: string;
  itemCount: number;
  items: Array<{
    id: string;
    medicine: {
      code: string;
      id: string;
      name: string;
    };
    prescriptionRequired: boolean;
    quantity: number;
    subtotal: string;
    unitPrice: string;
  }>;
  orderNumber: string;
  payments: Array<{
    amount: string;
    createdAt: Date | string;
    id: string;
    method: string;
    order: {
      id: string;
      orderNumber: string;
    };
    provider: string;
    providerReference: string | null;
    status: string;
  }>;
  prescriptionRequired: boolean;
  prescriptions: Array<{
    customer: {
      email: string | null;
      id: string;
      name: string | null;
    };
    id: string;
    order: {
      id: string;
      orderNumber: string;
      status: OrderStatus;
    };
    originalFileName: string;
    status: string;
    submittedAt: Date | string;
  }>;
  status: OrderStatus;
  statusHistory: Array<{
    actorName: string | null;
    createdAt: Date | string;
    fromStatus: OrderStatus | null;
    id: string;
    note: string | null;
    toStatus: OrderStatus;
  }>;
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: "Transfer Bank",
  CASH: "Tunai",
  PAYMENT_GATEWAY: "Payment Gateway",
  QRIS: "QRIS",
};

const TRANSITION_ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  CANCELLED: "Batalkan Pesanan",
  COMPLETED: "Selesaikan",
  PROCESSING: "Proses Pesanan",
  READY_FOR_PICKUP: "Siap Diambil",
  SHIPPED: "Kirim",
};

const TRANSITION_CONFIRM_LABELS: Partial<Record<OrderStatus, string>> = {
  CANCELLED: "Ya, Batalkan",
  COMPLETED: "Ya, Selesaikan",
  PROCESSING: "Ya, Proses",
  READY_FOR_PICKUP: "Ya, Siap Diambil",
  SHIPPED: "Ya, Kirim",
};

const TRANSITION_DESCRIPTIONS: Partial<Record<OrderStatus, string>> = {
  CANCELLED: "Pesanan akan dibatalkan dan stok yang direservasi akan dilepas.",
  COMPLETED: "Pesanan akan ditandai selesai.",
  PROCESSING: "Pesanan akan mulai diproses.",
  READY_FOR_PICKUP: "Pesanan akan ditandai siap diambil oleh pelanggan.",
  SHIPPED: "Pesanan akan ditandai telah dikirim.",
};

function getManualTransitions(status: OrderStatus): OrderStatus[] {
  const allowed = ORDER_STATUS_TRANSITIONS[status] ?? [];

  return allowed.filter((s) => s in TRANSITION_ACTION_LABELS);
}

function formatPaymentMethod(method: string): string {
  if (method in PAYMENT_METHOD_LABELS) {
    return PAYMENT_METHOD_LABELS[method as PaymentMethod];
  }

  return method;
}

type PageProps = {
  params: { id: string };
};

export default function OrderDetailPage({ params }: PageProps) {
 const { id } = use(params as any) as { id: string };
  const queryClient = useQueryClient();
  const [target, setTarget] = useState<TransitionTarget>(null);

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.orders({ id }).get();

      if (response.error) throw response.error;

      return response.data as OrderDetailResponse;
    },
    queryKey: ["orders", id],
  });

  const transitionMutation = useMutation({
    mutationFn: async ({
      orderId,
      nextStatus,
      note,
    }: {
      nextStatus: OrderStatus;
      note?: string;
      orderId: string;
    }) => {
      const response = await eden.api.v1.orders({ id: orderId }).transition.post(
        { nextStatus, note: note || undefined },
      );

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Transisi status pesanan gagal. Coba lagi.");
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      setTarget(null);
      toast.success(
        `Status pesanan berhasil diubah ke "${ORDER_STATUS_LABELS[variables.nextStatus]}".`,
      );
    },
  });

  const order = query.data;
  const isCancel = target?.nextStatus === "CANCELLED";
  const confirmDescription = target
    ? (TRANSITION_DESCRIPTIONS[target.nextStatus] ?? "Lanjutkan perubahan status pesanan ini?")
    : "";

  if (query.isError) {
    return (
      <section className="grid gap-4">
        <ButtonLink href={ROUTES.ORDERS.INDEX} leftIcon={<ArrowLeft />} variant="secondary">
          Kembali
        </ButtonLink>
        <ErrorState
          description="Detail pesanan gagal dimuat."
          onRetry={() => query.refetch()}
          title="Pesanan Tidak Tersedia"
        />
      </section>
    );
  }

  if (query.isLoading || !order) {
    return (
      <section className="grid gap-4">
        <ButtonLink href={ROUTES.ORDERS.INDEX} leftIcon={<ArrowLeft />} variant="secondary">
          Kembali
        </ButtonLink>
        <EmptyState description="Memuat detail pesanan..." title="Memuat" />
      </section>
    );
  }

  const manualTransitions = getManualTransitions(order.status);

  return (
    <section className="grid gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section className="grid gap-1">
          <ButtonLink
            href={ROUTES.ORDERS.INDEX}
            leftIcon={<ArrowLeft />}
            variant="secondary"
          >
            Kembali ke Daftar Pesanan
          </ButtonLink>
          <h1 className="ts-xl font-semibold text-text-strong">
            Pesanan {order.orderNumber}
          </h1>
          <p className="ts-sm text-text-muted">
            Dibuat pada {formatDateTime(order.createdAt)}
          </p>
        </section>
        <section className="flex flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <Badge tone={order.channel === "ONLINE" ? "info" : "primary"}>
            {ORDER_CHANNEL_LABELS[order.channel]}
          </Badge>
        </section>
      </header>

      {/* Transition action buttons */}
      {manualTransitions.length > 0 && (
        <section className="flex flex-wrap gap-2">
          {manualTransitions.map((nextStatus) => (
            <Button
              key={nextStatus}
              leftIcon={
                nextStatus === "CANCELLED" ? (
                  <X />
                ) : nextStatus === "PROCESSING" ? (
                  <Package />
                ) : nextStatus === "READY_FOR_PICKUP" ? (
                  <PackageCheck />
                ) : nextStatus === "SHIPPED" ? (
                  <Truck />
                ) : (
                  <CheckCircle />
                )
              }
              onClick={() =>
                setTarget({ id: order.id, nextStatus, note: "" })
              }
              variant={nextStatus === "CANCELLED" ? "danger" : "primary"}
            >
              {TRANSITION_ACTION_LABELS[nextStatus] ?? nextStatus}
            </Button>
          ))}
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left column — items, history */}
        <section className="grid gap-6 lg:col-span-2">
          {/* Order items */}
          <Card>
            <CardHeader>
              <CardTitle>Item Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              {order.items.length === 0 ? (
                <p className="ts-sm text-text-muted">Tidak ada item.</p>
              ) : (
                <DataTable>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Obat</TableHead>
                      <TableHead>Resep</TableHead>
                      <TableHead>Harga Satuan</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium text-text-strong">
                            {item.medicine.name}
                          </p>
                          <p className="ts-xs font-mono text-text-muted">
                            {item.medicine.code}
                          </p>
                        </TableCell>
                        <TableCell>
                          {item.prescriptionRequired ? (
                            <Badge tone="warning">Perlu Resep</Badge>
                          ) : (
                            <Badge tone="success">Bebas</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {formatRp(Number(item.unitPrice))}
                        </TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="font-medium">
                          {formatRp(Number(item.subtotal))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </DataTable>
              )}
              <section className="mt-4 flex justify-end border-t border-border-default pt-4">
                <section className="grid gap-1 text-right">
                  <p className="ts-sm text-text-muted">Grand Total</p>
                  <p className="ts-lg font-semibold text-text-strong">
                    {formatRp(Number(order.grandTotal))}
                  </p>
                </section>
              </section>
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Status</CardTitle>
            </CardHeader>
            <CardContent>
              {order.statusHistory.length === 0 ? (
                <p className="ts-sm text-text-muted">Belum ada riwayat status.</p>
              ) : (
                <ol className="grid gap-4">
                  {order.statusHistory.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start gap-4 border-b border-border-default pb-4 last:border-0 last:pb-0"
                    >
                      <section className="mt-0.5 grid shrink-0 gap-1 text-right">
                        <p className="ts-xs text-text-muted">
                          {formatDateTime(entry.createdAt)}
                        </p>
                      </section>
                      <section className="grid gap-1">
                        <section className="flex flex-wrap items-center gap-2">
                          {entry.fromStatus && (
                            <>
                              <OrderStatusBadge status={entry.fromStatus} />
                              <span className="ts-xs text-text-muted">→</span>
                            </>
                          )}
                          <OrderStatusBadge status={entry.toStatus} />
                        </section>
                        {entry.actorName && (
                          <p className="ts-xs text-text-muted">
                            oleh {entry.actorName}
                          </p>
                        )}
                        {entry.note && (
                          <p className="ts-sm text-text-default">{entry.note}</p>
                        )}
                      </section>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right column — customer, payment, prescription */}
        <section className="grid gap-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <CardTitle>Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <section className="grid gap-2">
                <section>
                  <p className="ts-xs text-text-muted">Nama</p>
                  <p className="ts-sm font-medium text-text-strong">
                    {order.customer.name ?? "Pelanggan umum"}
                  </p>
                </section>
                <section>
                  <p className="ts-xs text-text-muted">Email</p>
                  <p className="ts-sm text-text-default">
                    {order.customer.email ?? "-"}
                  </p>
                </section>
              </section>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle>Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              {order.payments.length === 0 ? (
                <p className="ts-sm text-text-muted">
                  Belum ada data pembayaran.
                </p>
              ) : (
                <section className="grid gap-4">
                  {order.payments.map((payment) => (
                    <section
                      key={payment.id}
                      className="grid gap-2 rounded-lg border border-border-default p-3"
                    >
                      <section className="flex items-center justify-between gap-2">
                        <p className="ts-sm font-medium text-text-strong">
                          {formatRp(Number(payment.amount))}
                        </p>
                        <StatusBadge
                          label={
                            PAYMENT_STATUS_LABELS[
                              payment.status as keyof typeof PAYMENT_STATUS_LABELS
                            ] ?? payment.status
                          }
                          tone={
                            payment.status === "PAID"
                              ? "success"
                              : payment.status === "PENDING" ||
                                  payment.status === "PROCESSING"
                                ? "warning"
                                : payment.status === "FAILED" ||
                                    payment.status === "EXPIRED"
                                  ? "danger"
                                  : "neutral"
                          }
                        />
                      </section>
                      <section className="grid gap-1">
                        <p className="ts-xs text-text-muted">
                          Metode:{" "}
                          <span className="text-text-default">
                            {formatPaymentMethod(payment.method)}
                          </span>
                        </p>
                        {payment.providerReference && (
                          <p className="ts-xs text-text-muted">
                            Ref:{" "}
                            <span className="font-mono text-text-default">
                              {payment.providerReference}
                            </span>
                          </p>
                        )}
                        <p className="ts-xs text-text-muted">
                          {formatDateTime(payment.createdAt)}
                        </p>
                      </section>
                    </section>
                  ))}
                </section>
              )}
            </CardContent>
          </Card>

          {/* Prescriptions */}
          {order.prescriptionRequired && (
            <Card>
              <CardHeader>
                <CardTitle>Resep</CardTitle>
              </CardHeader>
              <CardContent>
                {order.prescriptions.length === 0 ? (
                  <p className="ts-sm text-text-muted">
                    Belum ada resep diunggah.
                  </p>
                ) : (
                  <section className="grid gap-3">
                    {order.prescriptions.map((prescription) => (
                      <section
                        key={prescription.id}
                        className="grid gap-2 rounded-lg border border-border-default p-3"
                      >
                        <p className="ts-sm font-medium text-text-strong">
                          {prescription.originalFileName}
                        </p>
                        <section className="flex items-center gap-2">
                          <StatusBadge
                            label={
                              PRESCRIPTION_STATUS_LABELS[
                                prescription.status as keyof typeof PRESCRIPTION_STATUS_LABELS
                              ] ?? prescription.status
                            }
                            tone={
                              PRESCRIPTION_STATUS_TONES[
                                prescription.status as keyof typeof PRESCRIPTION_STATUS_TONES
                              ] ?? "neutral"
                            }
                          />
                        </section>
                        <p className="ts-xs text-text-muted">
                          Dikirim: {formatDateTime(prescription.submittedAt)}
                        </p>
                      </section>
                    ))}
                  </section>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      </section>

      {/* Transition confirm dialog (non-cancel) */}
      <ConfirmDialog
        cancelLabel="Batal"
        confirmLabel={
          target
            ? (TRANSITION_CONFIRM_LABELS[target.nextStatus] ?? "Konfirmasi")
            : "Konfirmasi"
        }
        description={confirmDescription}
        id="order-detail-transition-dialog"
        loading={transitionMutation.isPending}
        onCancel={() => {
          setTarget(null);
          transitionMutation.reset();
        }}
        onConfirm={() => {
          if (!target) return;

          transitionMutation.mutate({
            orderId: target.id,
            nextStatus: target.nextStatus,
            note: target.note || undefined,
          });
        }}
        open={target !== null && !isCancel}
        title={
          target
            ? (TRANSITION_ACTION_LABELS[target.nextStatus] ?? "Ubah Status Pesanan")
            : "Ubah Status Pesanan"
        }
        variant="info"
      />

      {/* Cancel dialog with reason textarea */}
      {target && isCancel && (
        <section className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-primary-navy/50 p-3 sm:p-4">
          <section
            aria-labelledby="cancel-order-dialog-title"
            aria-modal="true"
            className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-border-default bg-card-surface shadow-lg"
            role="dialog"
          >
            <header className="flex items-start justify-between gap-4 border-b border-border-default px-4 py-4 sm:px-6">
              <h2
                className="ts-lg font-semibold text-text-strong"
                id="cancel-order-dialog-title"
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
                id="cancel-order-note"
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
                    orderId: target.id,
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
    </section>
  );
}
