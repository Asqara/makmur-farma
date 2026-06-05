"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Badge,
  BrandLogo,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  StatusBadge,
  TextInput,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatStockQuantity } from "@/utils/inventoryDisplay";

type CatalogResponse = {
  data: Array<{
    category: {
      name: string | null;
    };
    id: string;
    lowStockThreshold: number;
    name: string;
    prescriptionRequired: boolean;
    primaryImageUrl: string | null;
    sellingPrice: string;
    slug: string;
    totalAvailable: number;
    unit: string;
  }>;
};

function availabilityTone(totalAvailable: number, lowStockThreshold: number) {
  if (totalAvailable <= 0) return "danger";
  if (totalAvailable <= lowStockThreshold) return "warning";
  return "success";
}

function availabilityLabel(totalAvailable: number, lowStockThreshold: number) {
  if (totalAvailable <= 0) return "Habis";
  if (totalAvailable <= lowStockThreshold) return "Stok Terbatas";
  return "Tersedia";
}

/**
 * Customer medicine catalog.
 */
export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const [addingId, setAddingId] = useState<string | null>(null);

  const addToCartMutation = useMutation({
    mutationFn: async (medicineId: string) => {
      setAddingId(medicineId);
      const response = await eden.api.v1.cart.items.post({
        medicineId,
        quantity: 1,
      });

      if (response.error) {
        const message =
          (response.error as { publicMessage?: string }).publicMessage ??
          "Gagal menambahkan ke keranjang.";
        throw new Error(message);
      }

      return response.data;
    },
    onSettled: () => {
      setAddingId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.catalog.medicines.get({
        query: {
          limit: "24",
          page: "1",
          search,
          sortBy: "name",
          sortDir: "asc",
        },
      });

      if (response.error) throw response.error;

      return response.data as CatalogResponse;
    },
    queryKey: ["catalog", search],
  });

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

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6">
        <section className="grid gap-3 md:grid-cols-[minmax(0,420px)_1fr] md:items-end">
          <TextInput
            id="catalog-search"
            label="Cari Obat"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau kategori obat"
            value={search}
          />
          <p className="ts-sm text-text-muted">
            Informasi obat memakai data demonstrasi yang tersimpan di database.
          </p>
        </section>

        {query.isError ? (
          <ErrorState
            description="Katalog gagal dimuat."
            onRetry={() => query.refetch()}
            title="Katalog Tidak Tersedia"
          />
        ) : query.data?.data.length ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {query.data.data.map((medicine) => (
              <Card className="grid overflow-hidden" key={medicine.id}>
                <section className="aspect-[4/3] bg-muted-surface">
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
                <section className="grid gap-3 p-4">
                  <section className="grid gap-1">
                    <p className="ts-xs text-text-muted">
                      {medicine.category.name ?? "Tanpa Kategori"}
                    </p>
                    <h2 className="ts-base font-semibold text-text-strong">
                      {medicine.name}
                    </h2>
                  </section>
                  <section className="flex flex-wrap gap-2">
                    <Badge
                      tone={
                        medicine.prescriptionRequired ? "warning" : "success"
                      }
                    >
                      {medicine.prescriptionRequired
                        ? "Perlu Resep"
                        : "Bebas"}
                    </Badge>
                    <StatusBadge
                      label={`${availabilityLabel(
                        medicine.totalAvailable,
                        medicine.lowStockThreshold,
                      )} - ${formatStockQuantity(
                        medicine.totalAvailable,
                        medicine.unit,
                      )}`}
                      tone={availabilityTone(
                        medicine.totalAvailable,
                        medicine.lowStockThreshold,
                      )}
                    />
                  </section>
                  <strong className="ts-lg text-text-strong">
                    {formatRp(Number(medicine.sellingPrice))}
                  </strong>
                  <section className="grid gap-2">
                    <Button
                      disabled={
                        medicine.totalAvailable <= 0 ||
                        addingId === medicine.id
                      }
                      onClick={() => addToCartMutation.mutate(medicine.id)}
                      type="button"
                    >
                      {addingId === medicine.id
                        ? "Menambahkan..."
                        : "Tambah ke Keranjang"}
                    </Button>
                    <ButtonLink
                      href={ROUTES.CATALOG.DETAIL(medicine.slug)}
                      size="sm"
                      variant="secondary"
                    >
                      Lihat Detail
                    </ButtonLink>
                  </section>
                </section>
              </Card>
            ))}
          </section>
        ) : (
          <EmptyState
            description={query.isLoading ? "Memuat katalog..." : "Tidak ada obat yang cocok."}
            title={query.isLoading ? "Memuat" : "Katalog Kosong"}
          />
        )}
      </section>
    </main>
  );
}
