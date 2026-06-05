"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  Skeleton,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";

type CartItem = {
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

type CartResponse = {
  id: string;
  items: CartItem[];
  status: string;
};

/**
 * Customer shopping cart page.
 */
export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const cartQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.cart.get();

      if (response.error) throw response.error;

      return response.data as CartResponse;
    },
    queryKey: ["cart"],
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      itemId,
      quantity,
    }: {
      itemId: string;
      quantity: number;
    }) => {
      const response = await eden.api.v1.cart.items({ itemId }).put({
        quantity,
      });

      if (response.error) {
        const message =
          (response.error as { publicMessage?: string }).publicMessage ??
          "Gagal memperbarui item.";
        throw new Error(message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const response = await eden.api.v1.cart.items({ itemId }).delete();

      if (response.error) {
        const message =
          (response.error as { publicMessage?: string }).publicMessage ??
          "Gagal menghapus item.";
        throw new Error(message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.cart.delete();

      if (response.error) {
        const message =
          (response.error as { publicMessage?: string }).publicMessage ??
          "Gagal mengosongkan keranjang.";
        throw new Error(message);
      }

      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["cart"], data);
    },
  });

  const cart = cartQuery.data;
  const items: CartItem[] = cart?.items ?? [];

  const subtotal = items.reduce((sum, item) => {
    return sum + Number(item.medicine.sellingPrice) * item.quantity;
  }, 0);

  const isMutating =
    updateMutation.isPending ||
    removeMutation.isPending ||
    clearMutation.isPending;

  return (
    <main className="min-h-screen bg-page-background">
      <header className="border-b border-border-default bg-card-surface">
        <section className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <BrandLogo />
          <nav className="flex items-center gap-2">
            <Link
              className="ts-sm rounded-lg px-3 py-2 text-text-default hover:bg-muted-surface"
              href={ROUTES.ACCOUNT}
            >
              Akun
            </Link>
          </nav>
        </section>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <h1 className="ts-xl mb-6 font-bold text-text-strong">Keranjang Belanja</h1>

        {cartQuery.isError ? (
          <ErrorState
            description="Keranjang gagal dimuat. Coba muat ulang halaman."
            onRetry={() => cartQuery.refetch()}
            title="Keranjang Tidak Tersedia"
          />
        ) : cartQuery.isLoading ? (
          <section className="grid gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </section>
        ) : items.length === 0 ? (
          <EmptyState
            description="Belum ada obat di keranjang Anda."
            title="Keranjang Kosong"
          >
            <ButtonLink href={ROUTES.CATALOG.INDEX} variant="primary">
              Lanjutkan Belanja
            </ButtonLink>
          </EmptyState>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <section className="grid gap-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-start justify-between gap-4 py-4">
                    <section className="grid min-w-0 flex-1 gap-1">
                      <p className="ts-sm font-semibold text-text-strong truncate">
                        {item.medicine.name}
                      </p>
                      {item.medicine.prescriptionRequired ? (
                        <p className="ts-xs text-warning">Perlu resep dokter</p>
                      ) : null}
                      <p className="ts-sm text-text-muted">
                        {formatRp(Number(item.medicine.sellingPrice))} /{" "}
                        {item.medicine.unit}
                      </p>
                      <p className="ts-sm font-semibold text-text-strong">
                        Subtotal:{" "}
                        {formatRp(
                          Number(item.medicine.sellingPrice) * item.quantity,
                        )}
                      </p>
                    </section>

                    <section className="flex shrink-0 items-center gap-2">
                      <section className="flex items-center rounded-md border border-border-default">
                        <button
                          aria-label="Kurangi jumlah"
                          className="grid size-8 place-items-center text-text-default transition-colors hover:bg-muted-surface disabled:opacity-40"
                          disabled={item.quantity <= 1 || isMutating}
                          onClick={() =>
                            updateMutation.mutate({
                              itemId: item.id,
                              quantity: item.quantity - 1,
                            })
                          }
                          type="button"
                        >
                          <Minus aria-hidden="true" className="size-3" />
                        </button>
                        <span className="ts-sm min-w-[2.5rem] text-center font-medium text-text-strong">
                          {item.quantity}
                        </span>
                        <button
                          aria-label="Tambah jumlah"
                          className="grid size-8 place-items-center text-text-default transition-colors hover:bg-muted-surface disabled:opacity-40"
                          disabled={isMutating}
                          onClick={() =>
                            updateMutation.mutate({
                              itemId: item.id,
                              quantity: item.quantity + 1,
                            })
                          }
                          type="button"
                        >
                          <Plus aria-hidden="true" className="size-3" />
                        </button>
                      </section>

                      <button
                        aria-label={`Hapus ${item.medicine.name} dari keranjang`}
                        className="grid size-8 place-items-center rounded-md text-text-muted transition-colors hover:bg-danger-surface hover:text-danger disabled:opacity-40"
                        disabled={isMutating}
                        onClick={() => removeMutation.mutate(item.id)}
                        type="button"
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </section>
                  </CardContent>
                </Card>
              ))}

              <Button
                className="self-start"
                disabled={isMutating}
                onClick={() => clearMutation.mutate()}
                size="sm"
                variant="ghost"
              >
                Kosongkan Keranjang
              </Button>
            </section>

            <aside>
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <section className="grid gap-2">
                    {items.map((item) => (
                      <section
                        className="flex items-center justify-between gap-2"
                        key={item.id}
                      >
                        <p className="ts-sm min-w-0 truncate text-text-default">
                          {item.medicine.name}{" "}
                          <span className="text-text-muted">×{item.quantity}</span>
                        </p>
                        <p className="ts-sm shrink-0 text-text-strong">
                          {formatRp(
                            Number(item.medicine.sellingPrice) * item.quantity,
                          )}
                        </p>
                      </section>
                    ))}
                  </section>

                  <hr className="border-border-default" />

                  <section className="flex items-center justify-between">
                    <p className="ts-base font-semibold text-text-strong">
                      Total
                    </p>
                    <p className="ts-lg font-bold text-text-strong">
                      {formatRp(subtotal)}
                    </p>
                  </section>

                  <ButtonLink href="/checkout" variant="primary">
                    Lanjut ke Checkout
                  </ButtonLink>

                  <ButtonLink
                    href={ROUTES.CATALOG.INDEX}
                    size="sm"
                    variant="secondary"
                  >
                    Lanjutkan Belanja
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
