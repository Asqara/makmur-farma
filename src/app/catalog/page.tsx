"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, X } from "lucide-react";
import { useState } from "react";

import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CustomerNavbar,
  EmptyState,
  ErrorState,
  Pagination,
  StatusBadge,
  TextInput,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { useCart } from "@/hooks/useCart";
import { useDebounce } from "@/hooks/useDebounce";
import { eden } from "@/lib/eden";
import { mc } from "@/utils/mc";
import { formatRp } from "@/utils/formatRp";
import { formatStockQuantity } from "@/utils/inventoryDisplay";

type CatalogMedicineItem = {
  category: { name: string | null };
  id: string;
  lowStockThreshold: number;
  name: string;
  prescriptionRequired: boolean;
  primaryImageUrl: string | null;
  sellingPrice: string;
  slug: string;
  totalAvailable: number;
  unit: string;
};

type CatalogResponse = {
  data: CatalogMedicineItem[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

type CategoryItem = {
  id: string;
  name: string;
};

type CategoriesResponse = {
  data: CategoryItem[];
};

type SortValue =
  | "createdAt-desc"
  | "name-asc"
  | "name-desc"
  | "price-asc"
  | "price-desc";

const SORT_OPTIONS: Array<{ label: string; value: SortValue }> = [
  { label: "Nama A–Z", value: "name-asc" },
  { label: "Nama Z–A", value: "name-desc" },
  { label: "Harga Terendah", value: "price-asc" },
  { label: "Harga Tertinggi", value: "price-desc" },
  { label: "Terbaru", value: "createdAt-desc" },
];

const PAGE_SIZE = 12;

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

function parseSortValue(value: SortValue) {
  const dashIndex = value.lastIndexOf("-");
  return {
    sortBy: value.slice(0, dashIndex),
    sortDir: value.slice(dashIndex + 1),
  };
}

/**
 * Customer medicine catalog with search, category filter, type filter, and sort.
 */
export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [prescriptionFilter, setPrescriptionFilter] = useState<
    "" | "false" | "true"
  >("");
  const [sort, setSort] = useState<SortValue>("name-asc");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim(), 300);
  const cart = useCart();
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  function updateFilter<T>(setter: (val: T) => void) {
    return (val: T) => {
      setter(val);
      setPage(1);
    };
  }

  const handleAddToCart = async (medicine: CatalogMedicineItem) => {
    setAddingId(medicine.id);
    try {
      await cart.addItem({
        medicineId: medicine.id,
        name: medicine.name,
        price: Number(medicine.sellingPrice),
        prescriptionRequired: medicine.prescriptionRequired,
        quantity: 1,
        unit: medicine.unit,
      });
      setAddedId(medicine.id);
      setTimeout(
        () => setAddedId((prev) => (prev === medicine.id ? null : prev)),
        1500,
      );
    } finally {
      setAddingId(null);
    }
  };

  const categoriesQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.catalog.categories.get({
        query: {},
      });

      if (response.error) throw response.error;

      return response.data as CategoriesResponse;
    },
    queryKey: ["catalog-categories"],
    staleTime: 60_000,
  });

  const { sortBy, sortDir } = parseSortValue(sort);

  const catalogQuery = useQuery({
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        limit: String(PAGE_SIZE),
        page: String(page),
        sortBy,
        sortDir,
      };

      if (debouncedSearch) queryParams.search = debouncedSearch;
      if (categoryId) queryParams.categoryId = categoryId;
      if (prescriptionFilter) {
        queryParams.prescriptionRequired = prescriptionFilter;
      }

      const response = await eden.api.v1.catalog.medicines.get({
        query: queryParams,
      });

      if (response.error) throw response.error;

      return response.data as CatalogResponse;
    },
    queryKey: [
      "catalog",
      debouncedSearch,
      categoryId,
      prescriptionFilter,
      sortBy,
      sortDir,
      page,
    ],
  });

  const categories = (categoriesQuery.data?.data ?? []) as CategoryItem[];
  const pageCount = catalogQuery.data?.pagination?.totalPages ?? 1;
  const hasActiveFilters = Boolean(search || categoryId || prescriptionFilter);

  function clearFilters() {
    setSearch("");
    setCategoryId("");
    setPrescriptionFilter("");
    setSort("name-asc");
    setPage(1);
  }

  return (
    <>
      <CustomerNavbar />
      <main className="min-h-screen bg-page-background">
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 md:px-6">
        {/* ── Filter bar ─────────────────────────────────────────────── */}
        <section className="grid gap-4 rounded-xl border border-border-default bg-card-surface p-4">
          <section className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <TextInput
              id="catalog-search"
              label="Cari Obat"
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Nama obat atau kategori"
              value={search}
            />

            {/* Sort select */}
            <section className="grid gap-1">
              <label
                className="ts-sm font-medium text-text-strong"
                htmlFor="catalog-sort"
              >
                Urutkan
              </label>
              <section className="relative">
                <select
                  className="h-10 w-full appearance-none rounded-lg border border-border-default bg-card-surface pl-3 pr-8 ts-sm text-text-strong focus:outline-none focus:ring-2 focus:ring-primary-blue sm:w-44"
                  id="catalog-sort"
                  onChange={(e) => {
                    setSort(e.target.value as SortValue);
                    setPage(1);
                  }}
                  value={sort}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                />
              </section>
            </section>
          </section>

          <section className="flex flex-wrap items-center gap-3">
            {/* Category filter */}
            {categories.length > 0 && (
              <section className="relative">
                <select
                  aria-label="Filter kategori"
                  className="h-9 appearance-none rounded-lg border border-border-default bg-card-surface pl-3 pr-8 ts-sm text-text-strong focus:outline-none focus:ring-2 focus:ring-primary-blue"
                  onChange={(e) => updateFilter(setCategoryId)(e.target.value)}
                  value={categoryId}
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  aria-hidden="true"
                  className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-text-muted"
                />
              </section>
            )}

            {/* Prescription type filter */}
            <section
              aria-label="Filter jenis obat"
              className="flex rounded-lg border border-border-default bg-muted-surface p-0.5"
              role="group"
            >
              {(
                [
                  { label: "Semua", value: "" },
                  { label: "Bebas", value: "false" },
                  { label: "Perlu Resep", value: "true" },
                ] as Array<{ label: string; value: "" | "false" | "true" }>
              ).map((opt) => (
                <button
                  aria-pressed={prescriptionFilter === opt.value}
                  className={mc(
                    "rounded-md px-3 py-1.5 ts-sm font-medium transition-colors",
                    prescriptionFilter === opt.value
                      ? "bg-card-surface text-text-strong shadow-sm"
                      : "text-text-muted hover:text-text-default",
                  )}
                  key={opt.value}
                  onClick={() =>
                    updateFilter(setPrescriptionFilter)(opt.value)
                  }
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </section>

            {hasActiveFilters && (
              <button
                className="flex items-center gap-1.5 ts-sm text-text-muted hover:text-text-default"
                onClick={clearFilters}
                type="button"
              >
                <X aria-hidden="true" className="size-3.5" />
                Hapus Filter
              </button>
            )}

            <span className="ml-auto ts-sm text-text-muted">
              {catalogQuery.data?.pagination
                ? `${catalogQuery.data.pagination.total} obat ditemukan`
                : null}
            </span>
          </section>
        </section>

        {/* ── Results ────────────────────────────────────────────────── */}
        {catalogQuery.isError ? (
          <ErrorState
            description="Katalog gagal dimuat."
            onRetry={() => catalogQuery.refetch()}
            title="Katalog Tidak Tersedia"
          />
        ) : catalogQuery.isLoading ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Card className="overflow-hidden" key={i}>
                <section className="aspect-4/3 animate-pulse bg-muted-surface" />
                <section className="grid gap-3 p-4">
                  <section className="h-4 animate-pulse rounded bg-muted-surface" />
                  <section className="h-6 animate-pulse rounded bg-muted-surface w-3/4" />
                  <section className="h-8 animate-pulse rounded bg-muted-surface w-1/2" />
                </section>
              </Card>
            ))}
          </section>
        ) : catalogQuery.data?.data.length ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {catalogQuery.data.data.map((medicine) => (
                <Card className="grid overflow-hidden" key={medicine.id}>
                  <section className="aspect-4/3 bg-muted-surface">
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
                        {medicine.prescriptionRequired ? "Perlu Resep" : "Bebas"}
                      </Badge>
                      <StatusBadge
                        label={`${availabilityLabel(
                          medicine.totalAvailable,
                          medicine.lowStockThreshold,
                        )} — ${formatStockQuantity(
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
                        className={
                          addedId === medicine.id
                            ? "bg-success text-text-inverse hover:bg-success"
                            : undefined
                        }
                        disabled={
                          medicine.totalAvailable <= 0 ||
                          addingId === medicine.id
                        }
                        onClick={() => handleAddToCart(medicine)}
                        type="button"
                        variant={addedId === medicine.id ? "primary" : "primary"}
                      >
                        {addingId === medicine.id
                          ? "Menambahkan..."
                          : addedId === medicine.id
                            ? "Ditambahkan ✓"
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

            {pageCount > 1 && (
              <section className="flex justify-center">
                <Pagination
                  currentPage={page}
                  onPageChange={setPage}
                  pageCount={pageCount}
                />
              </section>
            )}
          </>
        ) : (
          <EmptyState
            actionLabel="Hapus Semua Filter"
            description={
              hasActiveFilters
                ? "Tidak ada obat yang cocok dengan filter yang dipilih."
                : "Belum ada obat dalam katalog."
            }
            onAction={hasActiveFilters ? clearFilters : undefined}
            title={hasActiveFilters ? "Tidak Ada Hasil" : "Katalog Kosong"}
          />
        )}
      </section>
    </main>
    </>
  );
}
