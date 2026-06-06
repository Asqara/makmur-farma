"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle, Loader2, QrCode, XCircle } from "lucide-react";
import { use } from "react";

import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  StatusBadge,
  toast,
} from "@/components/ui";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  type PaymentStatus,
} from "@/constants/domain";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime } from "@/utils/inventoryDisplay";

type PaymentEvent = {
  eventType: string;
  id: string;
  providerEventId: string | null;
  receivedAt: Date | string;
  safePayload: Record<string, unknown>;
  status: PaymentStatus;
};

type PaymentDetailResponse = {
  events: PaymentEvent[];
  payment: {
    amount: string;
    createdAt: Date | string;
    expiresAt: Date | string | null;
    id: string;
    method: string;
    orderId: string;
    orderNumber: string;
    paidAt: Date | string | null;
    provider: string;
    providerReference: string | null;
    status: PaymentStatus;
    updatedAt: Date | string;
  };
};

type SimulateOutcome = "PAID" | "FAILED" | "EXPIRED";

type PageProps = {
  params: { id: string };
};

const PAYMENT_METHOD_DISPLAY: Record<string, string> = {
  BANK_TRANSFER: "Transfer Bank",
  CASH: "Tunai",
  PAYMENT_GATEWAY: "Payment Gateway",
  QRIS: "QRIS",
};

function formatMethod(method: string): string {
  return PAYMENT_METHOD_DISPLAY[method] ?? method;
}

function formatEventType(eventType: string): string {
  const labels: Record<string, string> = {
    "qris.callback": "Callback Pembayaran",
    "qris.initialized": "QRIS Diinisialisasi",
  };

  return labels[eventType] ?? eventType;
}

export default function PaymentDetailPage({ params }: PageProps) {
  const { id } = use(params as any) as { id: string };
  const queryClient = useQueryClient();

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.payments({ id }).get();

      if (response.error) throw response.error;

      return response.data as PaymentDetailResponse;
    },
    queryKey: ["payments", id],
  });

  const simulateMutation = useMutation({
    mutationFn: async (outcome: SimulateOutcome) => {
      const response = await eden.api.v1
        .payments({ id })
        .simulate.post({ outcome });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Simulasi pembayaran gagal. Coba lagi.");
    },
    onSuccess: (_data, outcome) => {
      queryClient.invalidateQueries({ queryKey: ["payments", id] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });

      const messages: Record<SimulateOutcome, string> = {
        EXPIRED: "Pembayaran telah disimulasikan sebagai kedaluwarsa.",
        FAILED: "Pembayaran telah disimulasikan sebagai gagal.",
        PAID: "Pembayaran berhasil dikonfirmasi melalui simulasi.",
      };

      toast.success(messages[outcome]);
    },
  });

  if (query.isError) {
    return (
      <section className="grid gap-4">
        <ButtonLink
          href={ROUTES.PAYMENTS.INDEX}
          leftIcon={<ArrowLeft />}
          variant="secondary"
        >
          Kembali
        </ButtonLink>
        <ErrorState
          description="Detail pembayaran gagal dimuat."
          onRetry={() => query.refetch()}
          title="Pembayaran Tidak Tersedia"
        />
      </section>
    );
  }

  if (query.isLoading || !query.data) {
    return (
      <section className="grid gap-4">
        <ButtonLink
          href={ROUTES.PAYMENTS.INDEX}
          leftIcon={<ArrowLeft />}
          variant="secondary"
        >
          Kembali
        </ButtonLink>
        <EmptyState description="Memuat detail pembayaran..." title="Memuat" />
      </section>
    );
  }

  const { payment, events } = query.data;
  const isPending = payment.status === "PENDING" || payment.status === "PROCESSING";
  const isQris = payment.method === "QRIS";

  return (
    <section className="grid gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <section className="grid gap-1">
          <ButtonLink
            href={ROUTES.PAYMENTS.INDEX}
            leftIcon={<ArrowLeft />}
            variant="secondary"
          >
            Kembali ke Daftar Pembayaran
          </ButtonLink>
          <h1 className="ts-xl font-semibold text-text-strong">
            Detail Pembayaran
          </h1>
          <p className="ts-sm text-text-muted">ID: {payment.id}</p>
        </section>
        <StatusBadge
          label={PAYMENT_STATUS_LABELS[payment.status]}
          tone={PAYMENT_STATUS_TONES[payment.status]}
        />
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <section className="grid gap-6 lg:col-span-2">
          {/* Payment info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 sm:grid-cols-2">
                <section>
                  <dt className="ts-xs text-text-muted">Metode</dt>
                  <dd className="ts-sm font-medium text-text-strong">
                    {formatMethod(payment.method)}
                  </dd>
                </section>
                <section>
                  <dt className="ts-xs text-text-muted">Provider</dt>
                  <dd className="ts-sm font-medium text-text-strong">
                    {payment.provider}
                  </dd>
                </section>
                <section>
                  <dt className="ts-xs text-text-muted">Jumlah</dt>
                  <dd className="ts-sm font-semibold text-text-strong">
                    {formatRp(Number(payment.amount))}
                  </dd>
                </section>
                <section>
                  <dt className="ts-xs text-text-muted">Status</dt>
                  <dd>
                    <StatusBadge
                      label={PAYMENT_STATUS_LABELS[payment.status]}
                      tone={PAYMENT_STATUS_TONES[payment.status]}
                    />
                  </dd>
                </section>
                {payment.providerReference && (
                  <section className="sm:col-span-2">
                    <dt className="ts-xs text-text-muted">
                      Referensi Provider
                    </dt>
                    <dd className="ts-sm font-mono text-text-default">
                      {payment.providerReference}
                    </dd>
                  </section>
                )}
                <section>
                  <dt className="ts-xs text-text-muted">Dibuat</dt>
                  <dd className="ts-sm text-text-default">
                    {formatDateTime(payment.createdAt)}
                  </dd>
                </section>
                {payment.paidAt && (
                  <section>
                    <dt className="ts-xs text-text-muted">Dibayar</dt>
                    <dd className="ts-sm text-text-default">
                      {formatDateTime(payment.paidAt)}
                    </dd>
                  </section>
                )}
                {payment.expiresAt && (
                  <section>
                    <dt className="ts-xs text-text-muted">Kedaluwarsa</dt>
                    <dd className="ts-sm text-text-default">
                      {formatDateTime(payment.expiresAt)}
                    </dd>
                  </section>
                )}
              </dl>
            </CardContent>
          </Card>

          {/* Event timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Riwayat Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="ts-sm text-text-muted">Belum ada riwayat event.</p>
              ) : (
                <ol className="grid gap-4">
                  {events.map((event) => (
                    <li
                      key={event.id}
                      className="flex items-start gap-4 border-b border-border-default pb-4 last:border-0 last:pb-0"
                    >
                      <section className="mt-0.5 shrink-0 text-right">
                        <p className="ts-xs text-text-muted">
                          {formatDateTime(event.receivedAt)}
                        </p>
                      </section>
                      <section className="grid flex-1 gap-1">
                        <section className="flex flex-wrap items-center gap-2">
                          <p className="ts-sm font-medium text-text-strong">
                            {formatEventType(event.eventType)}
                          </p>
                          <StatusBadge
                            label={PAYMENT_STATUS_LABELS[event.status]}
                            tone={PAYMENT_STATUS_TONES[event.status]}
                          />
                        </section>
                        {event.providerEventId && (
                          <p className="ts-xs font-mono text-text-muted">
                            {event.providerEventId}
                          </p>
                        )}
                        {typeof event.safePayload.simulatorNote === "string" && (
                          <p className="ts-xs text-text-muted italic">
                            {event.safePayload.simulatorNote}
                          </p>
                        )}
                      </section>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right column */}
        <section className="grid gap-6">
          {/* Order link */}
          <Card>
            <CardHeader>
              <CardTitle>Pesanan</CardTitle>
            </CardHeader>
            <CardContent>
              <section className="grid gap-2">
                <section>
                  <p className="ts-xs text-text-muted">Nomor Pesanan</p>
                  <p className="ts-sm font-mono font-medium text-text-strong">
                    {payment.orderNumber}
                  </p>
                </section>
                <ButtonLink
                  href={ROUTES.ORDERS.DETAIL(payment.orderId)}
                  size="sm"
                  variant="secondary"
                >
                  Lihat Pesanan
                </ButtonLink>
              </section>
            </CardContent>
          </Card>

          {/* QRIS Simulator panel */}
          {isQris && isPending && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Simulator QRIS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <section className="grid gap-4">
                  <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="ts-xs font-medium text-amber-800">
                      Mode Simulasi Demo
                    </p>
                    <p className="ts-xs mt-1 text-amber-700">
                      Gunakan tombol di bawah untuk mensimulasikan callback
                      pembayaran QRIS. Ini bukan transaksi nyata.
                    </p>
                  </section>

                  {payment.providerReference?.startsWith("SIM-") && (
                    <section className="rounded-lg bg-surface-raised p-3">
                      <p className="ts-xs text-text-muted">QR Demo Payload</p>
                      <p className="ts-xs mt-1 break-all font-mono text-text-strong">
                        DEMO-QR-{payment.providerReference}
                      </p>
                    </section>
                  )}

                  <section className="grid gap-2">
                    <Button
                      disabled={simulateMutation.isPending}
                      leftIcon={
                        simulateMutation.isPending &&
                        simulateMutation.variables === "PAID" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <CheckCircle />
                        )
                      }
                      onClick={() => simulateMutation.mutate("PAID")}
                      variant="primary"
                    >
                      Simulasi Berhasil
                    </Button>
                    <Button
                      disabled={simulateMutation.isPending}
                      leftIcon={
                        simulateMutation.isPending &&
                        simulateMutation.variables === "FAILED" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <XCircle />
                        )
                      }
                      onClick={() => simulateMutation.mutate("FAILED")}
                      variant="danger"
                    >
                      Simulasi Gagal
                    </Button>
                    <Button
                      disabled={simulateMutation.isPending}
                      leftIcon={
                        simulateMutation.isPending &&
                        simulateMutation.variables === "EXPIRED" ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Badge tone="neutral" className="h-4 w-4 rounded-full p-0" />
                        )
                      }
                      onClick={() => simulateMutation.mutate("EXPIRED")}
                      variant="secondary"
                    >
                      Simulasi Kedaluwarsa
                    </Button>
                  </section>
                </section>
              </CardContent>
            </Card>
          )}

          {/* Terminal state indicator when not pending */}
          {isQris && !isPending && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  Simulasi QRIS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="ts-sm text-text-muted">
                  Pembayaran sudah dalam status final.{" "}
                  <span className="font-medium text-text-default">
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </span>
                  .
                </p>
              </CardContent>
            </Card>
          )}
        </section>
      </section>
    </section>
  );
}
