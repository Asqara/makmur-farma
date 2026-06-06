"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  DateInput,
  type DateRangeValue,
  EmptyState,
  ErrorState,
  Pagination,
  SelectInput,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableSkeleton,
  TextInput,
} from "@/components/ui";
import {
  STOCK_MOVEMENT_TYPE_VALUES,
  type StockMovementType,
} from "@/constants/domain";
import type { StatusTone } from "@/constants/design";
import { eden } from "@/lib/eden";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime } from "@/utils/inventoryDisplay";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StockMovementRow = {
  actor: {
    id: string | null;
    name: string | null;
  };
  availableAfter: number;
  availableBefore: number;
  batchNumber: string;
  createdAt: Date | string;
  id: string;
  medicine: {
    code: string;
    id: string;
    name: string;
  };
  quantityDelta: number;
  reason: string;
  referenceId: string | null;
  referenceType: string | null;
  type: StockMovementType;
};

type MovementResponse = {
  data: StockMovementRow[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

// ---------------------------------------------------------------------------
// Movement type labels (Indonesian)
// ---------------------------------------------------------------------------

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  ADJUSTMENT: "Penyesuaian",
  CANCELLATION_RELEASE: "Pelepasan Pembatalan",
  DISPOSAL: "Pembuangan",
  IMPORT_OPENING: "Stok Awal",
  RECEIPT: "Penerimaan",
  RESERVATION: "Reservasi",
  RESERVATION_RELEASE: "Pelepasan Reservasi",
  RETURN: "Retur",
  SALE: "Penjualan",
};

const MOVEMENT_TYPE_TONES: Record<StockMovementType, StatusTone> = {
  ADJUSTMENT: "warning",
  CANCELLATION_RELEASE: "neutral",
  DISPOSAL: "danger",
  IMPORT_OPENING: "success",
  RECEIPT: "success",
  RESERVATION: "info",
  RESERVATION_RELEASE: "neutral",
  RETURN: "neutral",
  SALE: "primary",
};

// ---------------------------------------------------------------------------
// SelectInput options for movement type filter
// ---------------------------------------------------------------------------

const TYPE_FILTER_OPTIONS = [
  { label: "Semua Tipe", value: "" },
  ...STOCK_MOVEMENT_TYPE_VALUES.map((t) => ({
    label: MOVEMENT_TYPE_LABELS[t],
    value: t,
  })),
];

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 30;

const DATE_PRESETS = [
  {
    label: "Hari ini",
    getValue: () => {
      const today = getDateValue(new Date());
      return { from: today, to: today };
    },
  },
  {
    label: "7 hari terakhir",
    getValue: () => getRelativeDateRange(6),
  },
  {
    label: "30 hari terakhir",
    getValue: () => getRelativeDateRange(29),
  },
  {
    label: "Bulan ini",
    getValue: () => {
      const now = new Date();
      return {
        from: getDateValue(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: getDateValue(now),
      };
    },
  },
  {
    label: "Bulan lalu",
    getValue: () => {
      const now = new Date();
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const last = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: getDateValue(first), to: getDateValue(last) };
    },
  },
] as const;

function getDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getRelativeDateRange(daysBack: number): DateRangeValue {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - daysBack);

  return {
    from: getDateValue(from),
    to: getDateValue(to),
  };
}

export default function StockMovementsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>({
    from: "",
    to: "",
  });
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search.trim(), 300);

  const query = useQuery({
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        limit: String(PAGE_SIZE),
        page: String(page),
        sortBy: "createdAt",
        sortDir: "desc",
      };

      if (debouncedSearch) queryParams.search = debouncedSearch;
      if (typeFilter) queryParams.type = typeFilter;
      if (dateRange.from) queryParams.dateFrom = dateRange.from;
      if (dateRange.to) queryParams.dateTo = dateRange.to;

      const response = await eden.api.v1["stock-movements"].get({
        query: queryParams,
      });

      if (response.error) throw response.error;

      return response.data as MovementResponse;
    },
    queryKey: [
      "stock-movements",
      page,
      debouncedSearch,
      typeFilter,
      dateRange.from,
      dateRange.to,
    ],
  });

  function handleFilterChange() {
    setPage(1);
  }

  const pageCount = query.data?.pagination?.totalPages ?? 1;

  return (
    <DataTableShell
      description="Semua perubahan stok wajib terekam sebagai movement, bukan edit angka langsung."
      title="Pergerakan Stok"
      toolbar={
        <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_minmax(280px,360px)]">
          <TextInput
            id="movement-search"
            label="Cari"
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilterChange();
            }}
            placeholder="Nama/kode obat, batch, referensi..."
            value={search}
          />
          <SelectInput
            id="movement-type"
            label="Tipe Movement"
            onValueChange={(v) => {
              setTypeFilter(v);
              handleFilterChange();
            }}
            options={TYPE_FILTER_OPTIONS}
            value={typeFilter}
          />
          <section className="grid gap-2">
            <DateInput
              id="movement-date-range"
              label="Rentang Tanggal"
              mode="range"
              onValueChange={(value) => {
                setDateRange(value);
                handleFilterChange();
              }}
              placeholder="Pilih rentang tanggal"
              value={dateRange}
            />
            <section className="flex flex-wrap gap-1.5">
              {DATE_PRESETS.map((preset) => (
                <button
                  className="ts-xs rounded-md border border-border-default bg-card-surface px-2 py-1 text-text-muted hover:bg-muted-surface hover:text-text-strong"
                  key={preset.label}
                  onClick={() => {
                    setDateRange(preset.getValue());
                    handleFilterChange();
                  }}
                  type="button"
                >
                  {preset.label}
                </button>
              ))}
              <button
                className="ts-xs rounded-md border border-border-default bg-card-surface px-2 py-1 text-text-muted hover:bg-muted-surface hover:text-text-strong"
                onClick={() => {
                  setDateRange({ from: "", to: "" });
                  handleFilterChange();
                }}
                type="button"
              >
                Bersihkan
              </button>
            </section>
          </section>
        </section>
      }
      footer={
        pageCount > 1 ? (
          <section className="flex justify-center pt-2">
            <Pagination
              currentPage={page}
              onPageChange={setPage}
              pageCount={pageCount}
            />
          </section>
        ) : null
      }
    >
      {query.isError ? (
        <ErrorState
          description="Pergerakan stok gagal dimuat. Periksa koneksi dan coba lagi."
          onRetry={() => query.refetch()}
          title="Movement Tidak Tersedia"
        />
      ) : query.isLoading ? (
        <Card>
          <CardContent>
            <TableSkeleton columns={9} rows={8} />
          </CardContent>
        </Card>
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Obat</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Sebelum → Sesudah</TableHead>
                  <TableHead>Referensi</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Catatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((movement) => {
                  const isPositive = movement.quantityDelta >= 0;
                  const qtyColor = isPositive
                    ? "font-semibold text-success-text"
                    : "font-semibold text-danger-text";
                  const qtyPrefix = isPositive ? "+" : "";

                  const referenceLabel =
                    movement.referenceType && movement.referenceId
                      ? `${movement.referenceType}:${movement.referenceId.slice(0, 8)}…`
                      : movement.referenceType
                        ? movement.referenceType
                        : "-";

                  const reasonLabel = movement.reason
                    ? movement.reason.length > 40
                      ? `${movement.reason.slice(0, 40)}…`
                      : movement.reason
                    : "-";

                  return (
                    <TableRow key={movement.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(movement.createdAt)}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-text-strong">
                          {movement.medicine.name}
                        </p>
                        <p className="ts-xs text-text-muted">
                          {movement.medicine.code}
                        </p>
                      </TableCell>
                      <TableCell className="font-mono text-text-muted">
                        {movement.batchNumber}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={MOVEMENT_TYPE_LABELS[movement.type]}
                          tone={MOVEMENT_TYPE_TONES[movement.type]}
                        />
                      </TableCell>
                      <TableCell className={qtyColor}>
                        {qtyPrefix}
                        {movement.quantityDelta}
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono ts-xs text-text-muted">
                        {movement.availableBefore} → {movement.availableAfter}
                      </TableCell>
                      <TableCell
                        className="font-mono ts-xs text-text-muted"
                        title={
                          movement.referenceId
                            ? `${movement.referenceType}:${movement.referenceId}`
                            : undefined
                        }
                      >
                        {referenceLabel}
                      </TableCell>
                      <TableCell>{movement.actor.name ?? "Sistem"}</TableCell>
                      <TableCell
                        className="ts-xs text-text-muted"
                        title={movement.reason ?? undefined}
                      >
                        {reasonLabel}
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
            search || typeFilter || dateRange.from || dateRange.to
              ? "Tidak ada movement yang cocok dengan filter yang dipilih."
              : "Belum ada pergerakan stok yang tercatat."
          }
          title="Movement Tidak Ditemukan"
        />
      )}
    </DataTableShell>
  );
}
