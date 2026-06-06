"use client";

import { Minus, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CustomerNavbar,
  EmptyState,
  Skeleton,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { useCart } from "@/hooks/useCart";
import { formatRp } from "@/utils/formatRp";

/**
 * Customer shopping cart page.
 */
export default function CartPage() {
  const router = useRouter();
  const cart = useCart();

  const items = cart.items;

  const subtotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const isMutating = cart.isLoading;

  const handleCheckout = () => {
    if (!cart.isAuthenticated) {
      router.push(`${ROUTES.LOGIN}?redirectTo=/checkout`);
    } else {
      router.push("/checkout");
    }
  };

  return (
    <>
      <CustomerNavbar />
      <main className="min-h-screen bg-page-background">
      <section className="mx-auto max-w-5xl px-4 py-6 md:px-6">
        <h1 className="ts-xl mb-6 font-bold text-text-strong">Keranjang Belanja</h1>

        {cart.isLoading ? (
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
                <Card key={item.medicineId}>
                  <CardContent className="flex items-start justify-between gap-4 py-4">
                    <section className="grid min-w-0 flex-1 gap-1">
                      <p className="ts-sm font-semibold text-text-strong truncate">
                        {item.name}
                      </p>
                      {item.prescriptionRequired ? (
                        <p className="ts-xs text-warning">Perlu resep dokter</p>
                      ) : null}
                      <p className="ts-sm text-text-muted">
                        {formatRp(item.price)} /{" "}
                        {item.unit}
                      </p>
                      <p className="ts-sm font-semibold text-text-strong">
                        Subtotal:{" "}
                        {formatRp(item.price * item.quantity)}
                      </p>
                    </section>

                    <section className="flex shrink-0 items-center gap-2">
                      <section className="flex items-center rounded-md border border-border-default">
                        <button
                          aria-label="Kurangi jumlah"
                          className="grid size-8 place-items-center text-text-default transition-colors hover:bg-muted-surface disabled:opacity-40"
                          disabled={item.quantity <= 1 || isMutating}
                          onClick={() =>
                            cart.updateQuantity({
                              itemId: (item as any).itemId,
                              medicineId: item.medicineId,
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
                            cart.updateQuantity({
                              itemId: (item as any).itemId,
                              medicineId: item.medicineId,
                              quantity: item.quantity + 1,
                            })
                          }
                          type="button"
                        >
                          <Plus aria-hidden="true" className="size-3" />
                        </button>
                      </section>

                      <button
                        aria-label={`Hapus ${item.name} dari keranjang`}
                        className="grid size-8 place-items-center rounded-md text-text-muted transition-colors hover:bg-danger-surface hover:text-danger disabled:opacity-40"
                        disabled={isMutating}
                        onClick={() => cart.removeItem({ itemId: (item as any).itemId, medicineId: item.medicineId })}
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
                onClick={() => cart.clearCart()}
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
                        key={item.medicineId}
                      >
                        <p className="ts-sm min-w-0 truncate text-text-default">
                          {item.name}{" "}
                          <span className="text-text-muted">×{item.quantity}</span>
                        </p>
                        <p className="ts-sm shrink-0 text-text-strong">
                          {formatRp(item.price * item.quantity)}
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

                  <Button
                    disabled={isMutating}
                    onClick={handleCheckout}
                    variant="primary"
                  >
                    Lanjut ke Checkout
                  </Button>

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
    </>
  );
}
