"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, QrCode } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  BrandLogo,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ErrorState,
  Skeleton,
  toast,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";

/**
 * QRIS payment page for the customer demo flow.
 * Shows the simulated QR code and lets the customer confirm payment success.
 */
export default function QrisSimulatorPage() {
  const params = useParams();
  const router = useRouter();
  const paymentId = params.id as string;

  const paymentQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.payments({ id: paymentId }).get();
      if (response.error) throw response.error;
      return response.data;
    },
    queryKey: ["payments", paymentId],
    refetchInterval: (query) => {
      // Polling while pending
      return query.state.data?.payment.status === "PENDING" ? 3000 : false;
    },
  });

  const simulateMutation = useMutation({
    mutationFn: async (outcome: "PAID" | "FAILED" | "EXPIRED") => {
      const response = await eden.api.v1.payments({ id: paymentId }).simulate.post({
        outcome,
      });
      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: () => {
      toast.success("Callback simulasi berhasil dikirim.");
      paymentQuery.refetch();
    },
    onError: () => {
      toast.error("Gagal mengirim simulasi callback.");
    },
  });

  const payment = paymentQuery.data;

  if (paymentQuery.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-page-background p-6">
        <ErrorState
          description="Data pembayaran tidak ditemukan atau Anda tidak memiliki akses."
          onRetry={() => paymentQuery.refetch()}
          title="Pembayaran Tidak Ditemukan"
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page-background">
      <header className="border-b border-border-default bg-card-surface">
        <section className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <BrandLogo />
        </section>
      </header>

      <section className="mx-auto max-w-lg px-4 py-12 md:px-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-primary-blue-soft text-center">
            <CardTitle className="text-primary-blue">QRIS Simulator</CardTitle>
            <p className="ts-xs text-primary-blue/80">Simulator Pembayaran Makmur Farma</p>
          </CardHeader>
          <CardContent className="grid gap-8 py-8">
            {paymentQuery.isLoading ? (
              <section className="grid place-items-center gap-4">
                <Skeleton className="size-48 rounded-lg" />
                <Skeleton className="h-6 w-32" />
              </section>
            ) : (
              <>
                <section className="text-center">
                  <p className="ts-sm text-text-muted">Total Pembayaran</p>
                  <p className="ts-2xl font-bold text-text-strong">
                    {formatRp(Number(payment?.payment.amount || 0))}
                  </p>
                </section>

                <section className="grid place-items-center gap-4">
                  <section className="relative grid size-48 place-items-center rounded-xl border-2 border-border-default bg-card-surface shadow-sm">
                    <QrCode className="size-32 text-text-strong opacity-20" />
                    <section className="absolute inset-0 grid place-items-center">
                       <p className="ts-xs font-bold uppercase tracking-widest text-text-disabled rotate-45">SIMULATED QR</p>
                    </section>
                  </section>
                  <section className="text-center">
                    <p className="ts-sm font-semibold text-text-strong">
                      Status: {payment?.payment.status}
                    </p>
                    {payment?.payment.status === "PENDING" ? (
                      <p className="ts-xs flex items-center justify-center gap-2 text-text-muted">
                        <Loader2 className="size-3 animate-spin" />
                        Menunggu pembayaran...
                      </p>
                    ) : (
                      <p className="ts-sm font-bold text-success">
                        Pembayaran Selesai
                      </p>
                    )}
                  </section>
                </section>

                {payment?.payment.status === "PENDING" && (
                  <section className="grid gap-3">
                    <p className="ts-xs text-center font-medium text-text-muted">
                      Demo pembayaran QRIS. Klik tombol setelah Anda memindai QR.
                    </p>
                    <Button
                      disabled={simulateMutation.isPending}
                      leftIcon={
                        simulateMutation.isPending ? (
                          <Loader2 className="animate-spin" />
                        ) : undefined
                      }
                      onClick={() => simulateMutation.mutate("PAID")}
                      variant="primary"
                    >
                      Konfirmasi Pembayaran
                    </Button>
                  </section>
                )}

                <section className="flex flex-col gap-2 pt-4">
                  <Button
                    onClick={() => router.push(ROUTES.ACCOUNT)}
                    variant="ghost"
                  >
                    Kembali ke Pesanan Saya
                  </Button>
                </section>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
