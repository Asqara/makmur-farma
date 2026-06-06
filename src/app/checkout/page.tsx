"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  BrandLogo,
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  ErrorState,
  SelectInput,
  type SelectInputOption,
  Skeleton,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";

type CartItem = {
  id: string;
  medicine: {
    id: string;
    name: string;
    prescriptionRequired: boolean;
    sellingPrice: string;
    unit: string;
  };
  quantity: number;
};

type CartResponse = {
  id: string;
  items: CartItem[];
  status: string;
};

type CheckoutResult = {
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

const PAYMENT_OPTIONS: SelectInputOption[] = [
  { label: "Tunai (Bayar di Tempat)", value: "CASH" },
  { label: "Transfer Bank", value: "BANK_TRANSFER" },
  { label: "QRIS", value: "QRIS" },
];

const FULFILLMENT_OPTIONS: SelectInputOption[] = [
  { label: "Ambil di Apotek (Pickup)", value: "PICKUP" },
  { label: "Pengiriman ke Alamat", value: "DELIVERY" },
];

function generateIdempotencyKey() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CHK-${ts}-${rand}`;
}

/**
 * Customer checkout page — cart summary, payment method, and order creation.
 */
export default function CheckoutPage() {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [fulfillmentMethod, setFulfillmentMethod] = useState("PICKUP");
  const [idempotencyKey] = useState(generateIdempotencyKey);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cartQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.cart.get();

      if (response.error) throw response.error;

      return response.data as CartResponse;
    },
    queryKey: ["cart"],
    retry: false,
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.checkout.post({
        fulfillmentMethod: fulfillmentMethod as "PICKUP" | "DELIVERY",
        idempotencyKey,
        paymentMethod: paymentMethod as "CASH" | "BANK_TRANSFER" | "QRIS",
      });

      if (response.error) {
        const message =
          (response.error as { publicMessage?: string }).publicMessage ??
          "Checkout gagal. Coba lagi.";
        throw new Error(message);
      }

      return response.data as CheckoutResult;
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
    },
    onSuccess: (data) => {
      setResult(data);
      setErrorMessage(null);
    },
  });

  const items: CartItem[] = cartQuery.data?.items ?? [];
  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.medicine.sellingPrice) * item.quantity;
  }, 0);
  const hasPrescription = items.some((i) => i.medicine.prescriptionRequired);

  if (result) {
    return (
      <main className="min-h-screen bg-page-background">
        <header className="border-b border-border-default bg-card-surface">
          <section className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
            <BrandLogo />
          </section>
        </header>

        <section className="mx-auto flex max-w-lg flex-col items-center gap-6 px-4 py-12 text-center md:px-6">
          <CheckCircle aria-hidden="true" className="size-16 text-success" />
          <section className="grid gap-2">
            <h1 className="ts-xl font-bold text-text-strong">
              Pesanan Berhasil Dibuat!
            </h1>
            <p className="ts-sm text-text-muted">
              Nomor pesanan Anda:{" "}
              <strong className="text-text-strong">
                {result.order.orderNumber}
              </strong>
            </p>
          </section>

          <Card className="w-full text-left">
            <CardContent className="grid gap-3 py-4">
              <section className="flex justify-between">
                <span className="ts-sm text-text-muted">Status Pesanan</span>
                <span className="ts-sm font-medium text-text-strong">
                  {result.order.status === "AWAITING_PRESCRIPTION"
                    ? "Menunggu Verifikasi Resep"
                    : "Menunggu Pembayaran"}
                </span>
              </section>
              <section className="flex justify-between">
                <span className="ts-sm text-text-muted">Metode Pembayaran</span>
                <span className="ts-sm font-medium text-text-strong">
                  {result.payment.method === "CASH"
                    ? "Tunai"
                    : result.payment.method === "BANK_TRANSFER"
                      ? "Transfer Bank"
                      : "QRIS"}
                </span>
              </section>
              <section className="flex justify-between">
                <span className="ts-sm text-text-muted">Total</span>
                <span className="ts-sm font-bold text-text-strong">
                  {formatRp(Number(result.order.grandTotal))}
                </span>
              </section>
              {result.order.prescriptionRequired ? (
                <p className="ts-xs text-warning">
                  Pesanan ini memerlukan verifikasi resep oleh apoteker sebelum diproses.
                </p>
              ) : null}
            </CardContent>
          </Card>

          <section className="flex w-full flex-col gap-3">
            {result.payment.method === "QRIS" && result.payment.status === "PENDING" ? (
              <ButtonLink href={`/checkout/${result.payment.id}/qris`} variant="primary">
                Bayar Sekarang (QRIS)
              </ButtonLink>
            ) : (
              <ButtonLink href={ROUTES.ACCOUNT} variant="primary">
                Lihat Pesanan Saya
              </ButtonLink>
            )}
            <ButtonLink href={ROUTES.CATALOG.INDEX} variant="secondary">
              Lanjutkan Belanja
            </ButtonLink>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page-background">
      <header className="border-b border-border-default bg-card-surface">
        <section className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <BrandLogo />
          <nav className="flex items-center gap-2">
            <Link
              className="ts-sm rounded-lg px-3 py-2 text-text-default hover:bg-muted-surface"
              href="/cart"
            >
              Keranjang
            </Link>
          </nav>
        </section>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        <h1 className="ts-xl mb-6 font-bold text-text-strong">Checkout</h1>

        {cartQuery.isError ? (
          <ErrorState
            description="Keranjang gagal dimuat."
            onRetry={() => cartQuery.refetch()}
            title="Gagal Memuat Keranjang"
          />
        ) : cartQuery.isLoading ? (
          <section className="grid gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            description="Keranjang Anda kosong. Tambahkan obat terlebih dahulu."
            title="Keranjang Kosong"
          >
            <ButtonLink href={ROUTES.CATALOG.INDEX} variant="primary">
              Ke Katalog
            </ButtonLink>
          </EmptyState>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
            <section className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {items.map((item) => (
                    <section
                      className="flex items-center justify-between gap-2"
                      key={item.id}
                    >
                      <section className="min-w-0">
                        <p className="ts-sm truncate font-medium text-text-strong">
                          {item.medicine.name}
                        </p>
                        <p className="ts-xs text-text-muted">
                          {item.quantity} × {formatRp(Number(item.medicine.sellingPrice))}
                        </p>
                        {item.medicine.prescriptionRequired ? (
                          <p className="ts-xs text-warning">Perlu resep</p>
                        ) : null}
                      </section>
                      <p className="ts-sm shrink-0 font-semibold text-text-strong">
                        {formatRp(
                          Number(item.medicine.sellingPrice) * item.quantity,
                        )}
                      </p>
                    </section>
                  ))}

                  <hr className="border-border-default" />

                  <section className="flex items-center justify-between">
                    <p className="ts-base font-bold text-text-strong">Total</p>
                    <p className="ts-lg font-bold text-text-strong">
                      {formatRp(subtotal)}
                    </p>
                  </section>
                </CardContent>
              </Card>

              {hasPrescription ? (
                <Card>
                  <CardContent className="py-4">
                    <p className="ts-sm text-warning font-medium">
                      Pesanan ini mengandung obat yang memerlukan resep dokter.
                      Setelah pesanan dibuat, Anda perlu mengunggah resep untuk diverifikasi apoteker.
                    </p>
                  </CardContent>
                </Card>
              ) : null}
            </section>

            <aside className="grid gap-4 content-start">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Pengiriman</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <SelectInput
                    id="fulfillment-method"
                    label="Metode Pengambilan"
                    onValueChange={setFulfillmentMethod}
                    options={FULFILLMENT_OPTIONS}
                    required
                    value={fulfillmentMethod}
                  />
                  <SelectInput
                    id="payment-method"
                    label="Metode Pembayaran"
                    onValueChange={setPaymentMethod}
                    options={PAYMENT_OPTIONS}
                    required
                    value={paymentMethod}
                  />

                  {errorMessage ? (
                    <p className="ts-sm font-medium text-danger" role="alert">
                      {errorMessage}
                    </p>
                  ) : null}

                  <Button
                    disabled={checkoutMutation.isPending || !paymentMethod}
                    onClick={() => checkoutMutation.mutate()}
                    type="button"
                  >
                    {checkoutMutation.isPending
                      ? "Memproses..."
                      : "Buat Pesanan"}
                  </Button>

                  <ButtonLink href="/cart" size="sm" variant="ghost">
                    Kembali ke Keranjang
                  </ButtonLink>
                </CardContent>
              </Card>
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
