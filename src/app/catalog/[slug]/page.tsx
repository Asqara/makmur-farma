"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import {
  Badge,
  BrandLogo,
  Button,
  ButtonLink,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useCart } from "@/hooks/useCart";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatStockQuantity } from "@/utils/inventoryDisplay";

type MedicineDetail = {
  category: { name: string | null };
  criticalStockThreshold: number;
  description?: string | null;
  id: string;
  lowStockThreshold: number;
  name: string;
  prescriptionRequired: boolean;
  primaryImageUrl: string | null;
  sellingPrice: string;
  slug: string;
  status: string;
  totalAvailable: number;
  unit: string;
};

function availabilityTone(totalAvailable: number, lowStockThreshold: number) {
  if (totalAvailable <= 0) return "danger" as const;
  if (totalAvailable <= lowStockThreshold) return "warning" as const;
  return "success" as const;
}

function availabilityLabel(totalAvailable: number, lowStockThreshold: number) {
  if (totalAvailable <= 0) return "Habis";
  if (totalAvailable <= lowStockThreshold) return "Stok Terbatas";
  return "Tersedia";
}

/**
 * Customer-facing medicine detail page.
 */
export default function CatalogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const cart = useCart();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const query = useQuery({
    enabled: Boolean(slug),
    queryFn: async () => {
      const response = await eden.api.v1.catalog.medicines({ slug }).get();

      if (response.error) throw response.error;

      return response.data as MedicineDetail;
    },
    queryKey: ["catalog-detail", slug],
  });

  const handleAddToCart = async () => {
    if (!query.data) return;
    setIsAdding(true);
    setAddedMessage(null);
    try {
      await cart.addItem({
        medicineId: query.data.id,
        quantity,
        name: query.data.name,
        price: Number(query.data.sellingPrice),
        prescriptionRequired: query.data.prescriptionRequired,
        unit: query.data.unit,
      });
      setAddedMessage("Obat berhasil ditambahkan ke keranjang!");
      setTimeout(() => setAddedMessage(null), 3000);
    } catch (error: any) {
      setAddedMessage(error.message || "Gagal menambahkan ke keranjang.");
    } finally {
      setIsAdding(false);
    }
  };

  const medicine = query.data;
  const outOfStock = medicine ? medicine.totalAvailable <= 0 : false;
  const cannotAdd = outOfStock || isAdding;

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
            <ButtonLink
              href="/cart"
              leftIcon={<ShoppingCart aria-hidden="true" className="size-4" />}
              size="sm"
            >
              Keranjang
            </ButtonLink>
          </nav>
        </section>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-6 md:px-6">
        <Link
          className="ts-sm mb-6 inline-flex items-center gap-1.5 text-text-muted hover:text-text-default"
          href={ROUTES.CATALOG.INDEX}
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Kembali ke Katalog
        </Link>

        {query.isError ? (
          <ErrorState
            description="Detail obat gagal dimuat. Coba kembali ke katalog."
            onRetry={() => query.refetch()}
            title="Obat Tidak Ditemukan"
          />
        ) : query.isLoading ? (
          <section className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <section className="grid gap-4">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </section>
          </section>
        ) : !medicine ? (
          <EmptyState
            description="Obat yang Anda cari tidak tersedia di katalog."
            title="Obat Tidak Ditemukan"
          />
        ) : (
          <section className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
            <section className="aspect-[4/3] overflow-hidden rounded-xl bg-muted-surface">
              {medicine.primaryImageUrl ? (
                <img
                  alt={medicine.name}
                  className="h-full w-full object-cover"
                  src={medicine.primaryImageUrl}
                />
              ) : (
                <section className="grid h-full place-items-center text-text-muted">
                  <span className="ts-sm">Makmur Farma</span>
                </section>
              )}
            </section>

            <section className="grid content-start gap-4">
              <section className="grid gap-1">
                <p className="ts-xs text-text-muted">
                  {medicine.category.name ?? "Tanpa Kategori"}
                </p>
                <h1 className="ts-xl font-bold text-text-strong">
                  {medicine.name}
                </h1>
              </section>

              <section className="flex flex-wrap gap-2">
                <Badge
                  tone={medicine.prescriptionRequired ? "warning" : "success"}
                >
                  {medicine.prescriptionRequired ? "Perlu Resep" : "Bebas"}
                </Badge>
                <StatusBadge
                  label={`${availabilityLabel(medicine.totalAvailable, medicine.lowStockThreshold)} — ${formatStockQuantity(medicine.totalAvailable, medicine.unit)}`}
                  tone={availabilityTone(
                    medicine.totalAvailable,
                    medicine.lowStockThreshold,
                  )}
                />
              </section>

              <strong className="ts-2xl text-text-strong">
                {formatRp(Number(medicine.sellingPrice))}
              </strong>

              {medicine.description ? (
                <p className="ts-sm text-text-default">{medicine.description}</p>
              ) : null}

              {medicine.prescriptionRequired ? (
                <Card>
                  <CardContent className="py-3">
                    <p className="ts-sm text-text-muted">
                      Obat ini memerlukan resep dokter. Unggah resep saat checkout untuk melanjutkan pembelian.
                    </p>
                  </CardContent>
                </Card>
              ) : null}

              {addedMessage ? (
                <p
                  className={`ts-sm font-medium ${addedMessage.includes("berhasil") ? "text-success" : "text-danger"}`}
                  role="status"
                >
                  {addedMessage}
                </p>
              ) : null}

              <section className="flex items-center gap-3">
                <section className="flex items-center rounded-md border border-border-default">
                  <button
                    aria-label="Kurangi jumlah"
                    className="grid size-9 place-items-center text-text-default transition-colors hover:bg-muted-surface disabled:opacity-40"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    type="button"
                  >
                    −
                  </button>
                  <span className="ts-sm min-w-[2.5rem] text-center font-medium text-text-strong">
                    {quantity}
                  </span>
                  <button
                    aria-label="Tambah jumlah"
                    className="grid size-9 place-items-center text-text-default transition-colors hover:bg-muted-surface disabled:opacity-40"
                    disabled={outOfStock}
                    onClick={() => setQuantity((q) => q + 1)}
                    type="button"
                  >
                    +
                  </button>
                </section>

                <Button
                  className="flex-1"
                  disabled={cannotAdd}
                  leftIcon={<ShoppingCart aria-hidden="true" className="size-4" />}
                  onClick={handleAddToCart}
                  type="button"
                >
                  {isAdding
                    ? "Menambahkan..."
                    : outOfStock
                      ? "Stok Habis"
                      : "Tambah ke Keranjang"}
                </Button>
              </section>

              <ButtonLink href="/cart" size="sm" variant="secondary">
                Lihat Keranjang
              </ButtonLink>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}
