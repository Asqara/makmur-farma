"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, ShieldOff, Thermometer } from "lucide-react";
import { useState } from "react";

import {
  ActionMenu,
  ButtonLink,
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  DataTableShell,
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
  toast,
} from "@/components/ui";
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
  type BatchStatus,
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { ROUTES } from "@/constants/routes";
import { useDebounce } from "@/hooks/useDebounce";
import { formatStockQuantity } from "@/utils/inventoryDisplay";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BatchRow = {
  availableQuantity: number;
  batchNumber: string;
  expiryDate: Date | string;
  id: string;
  medicine: {
    code: string;
    id: string;
    name: string;
    unit: string;
  };
  purchaseCost: string;
  receivedDate: Date | string;
  reservedQuantity: number;
  status: BatchStatus;
  supplier: {
    id: string | null;
    name: string | null;
  };
};

type BatchResponse = {
  data: BatchRow[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
};

// ---------------------------------------------------------------------------
// Expiry window options
// ---------------------------------------------------------------------------

const EXPIRY_WINDOW_OPTIONS = [
  { label: "Dalam 30 Hari", value: "30" },
  { label: "Dalam 60 Hari", value: "60" },
  { label: "Dalam 90 Hari", value: "90" },
  { label: "Sudah Kedaluwarsa", value: "expired" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns remaining days until expiry (negative = already expired).
 * Uses start-of-today for consistent day calculation.
 */
function daysUntilExpiry(expiryDate: Date | string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  return Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
}

function formatExpiryDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(date);
}

type ExpiryTone = "danger" | "warning" | "info";

function getExpiryTone(days: number): ExpiryTone {
  if (days <= 0) return "danger";
  if (days <= 30) return "danger";
  if (days <= 60) return "warning";

  return "info";
}

function formatDaysLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} hari lalu`;
  if (days === 0) return "Kedaluwarsa hari ini";

  return `${days} hari lagi`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 50;

export default function ExpiryMonitoringPage() {
  const queryClient = useQueryClient();

  const [expiryWindow, setExpiryWindow] = useState<string>("30");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [page, setPage] = useState(1);

  // Block dialog state
  const [blockTarget, setBlockTarget] = useState<BatchRow | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockReasonError, setBlockReasonError] = useState("");

  const query = useQuery({
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        expiryWindow,
        limit: String(PAGE_SIZE),
        page: String(page),
        sortBy: "expiryDate",
        sortDir: "asc",
      };

      if (debouncedSearch) queryParams.search = debouncedSearch;

      const response = await eden.api.v1.batches.get({ query: queryParams });

      if (response.error) throw response.error;

      return response.data as BatchResponse;
    },
    queryKey: ["batches-expiry", expiryWindow, debouncedSearch, page],
  });

  const blockMutation = useMutation({
    mutationFn: async ({ batchId, reason }: { batchId: string; reason: string }) => {
      const response = await eden.api.v1.batches({ id: batchId }).block.post({
        reason,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "publicMessage" in err
          ? String((err as { publicMessage: string }).publicMessage)
          : "Gagal memblokir batch.";

      toast.error(message);
    },
    onSuccess: (_, variables) => {
      toast.success(`Batch berhasil diblokir.`);
      setBlockTarget(null);
      setBlockReason("");
      setBlockReasonError("");
      queryClient.invalidateQueries({ queryKey: ["batches-expiry"] });
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  function handleBlockOpen(batch: BatchRow) {
    setBlockTarget(batch);
    setBlockReason("");
    setBlockReasonError("");
  }

  function handleBlockCancel() {
    setBlockTarget(null);
    setBlockReason("");
    setBlockReasonError("");
  }

  function handleBlockConfirm() {
    if (!blockTarget) return;

    if (!blockReason.trim() || blockReason.trim().length < 3) {
      setBlockReasonError("Alasan minimal 3 karakter.");

      return;
    }

    blockMutation.mutate({ batchId: blockTarget.id, reason: blockReason.trim() });
  }

  const selectedWindowLabel =
    EXPIRY_WINDOW_OPTIONS.find((o) => o.value === expiryWindow)?.label ?? "";

  return (
    <>
      <DataTableShell
        description="Monitor batch yang akan atau sudah kedaluwarsa. Ambil tindakan sebelum stok tidak layak digunakan."
        footer={
          query.data?.pagination ? (
            <section className="flex flex-wrap items-center justify-between gap-3">
              <p className="ts-sm text-text-muted">
                {query.data.pagination.total} batch ditemukan
              </p>
              <Pagination
                currentPage={page}
                onPageChange={setPage}
                pageCount={Math.max(query.data.pagination.totalPages, 1)}
              />
            </section>
          ) : null
        }
        title="Monitor Kedaluwarsa"
        toolbar={
          <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <section className="grid gap-3 sm:grid-cols-2">
              <SelectInput
                id="expiry-window"
                label="Rentang Waktu"
                onValueChange={(v) => {
                  setExpiryWindow(v);
                  setPage(1);
                }}
                options={EXPIRY_WINDOW_OPTIONS}
                value={expiryWindow}
              />
              <TextInput
                id="expiry-search"
                label="Cari Obat / Batch"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Nama obat, kode, atau nomor batch..."
                value={search}
              />
            </section>
            <ButtonLink
              href={ROUTES.BATCHES.INDEX}
              leftIcon={<Thermometer />}
              variant="secondary"
            >
              Semua Batch
            </ButtonLink>
          </section>
        }
      >
        {query.isError ? (
          <ErrorState
            description="Data kedaluwarsa gagal dimuat. Periksa koneksi dan coba lagi."
            onRetry={() => query.refetch()}
            title="Data Tidak Tersedia"
          />
        ) : query.isLoading ? (
          <Card>
            <CardContent>
              <TableSkeleton columns={7} rows={8} />
            </CardContent>
          </Card>
        ) : query.data?.data.length ? (
          <Card>
            <CardContent>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Obat</TableHead>
                    <TableHead>No. Batch</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Kedaluwarsa</TableHead>
                    <TableHead>Sisa Hari</TableHead>
                    <TableHead>Stok Tersedia</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((batch) => {
                    const days = daysUntilExpiry(batch.expiryDate);
                    const expiryTone = getExpiryTone(days);
                    const daysLabel = formatDaysLabel(days);
                    const canBlock =
                      batch.status === "AVAILABLE" || batch.status === "EXPIRED";

                    return (
                      <TableRow key={batch.id}>
                        <TableCell>
                          <p className="font-medium text-text-strong">
                            {batch.medicine.name}
                          </p>
                          <p className="ts-xs text-text-muted">
                            {batch.medicine.code}
                          </p>
                        </TableCell>
                        <TableCell className="font-mono text-text-muted">
                          {batch.batchNumber}
                        </TableCell>
                        <TableCell>{batch.supplier.name ?? "-"}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {formatExpiryDate(batch.expiryDate)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              expiryTone === "danger"
                                ? "font-semibold text-danger-text"
                                : expiryTone === "warning"
                                  ? "font-semibold text-warning-text"
                                  : "text-info-text"
                            }
                          >
                            {daysLabel}
                          </span>
                        </TableCell>
                        <TableCell>
                          {formatStockQuantity(
                            batch.availableQuantity,
                            batch.medicine.unit,
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={BATCH_STATUS_LABELS[batch.status]}
                            tone={BATCH_STATUS_TONES[batch.status]}
                          />
                        </TableCell>
                        <TableCell>
                          <ActionMenu
                            items={[
                              {
                                href: ROUTES.BATCHES.DETAIL(batch.id),
                                icon: <Eye className="size-4" />,
                                label: "Lihat Batch",
                              },
                              ...(canBlock
                                ? [
                                    {
                                      icon: <ShieldOff className="size-4" />,
                                      label: "Blokir Batch",
                                      onSelect: () => handleBlockOpen(batch),
                                    },
                                  ]
                                : []),
                            ]}
                            label={`Aksi batch ${batch.batchNumber}`}
                          />
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
              expiryWindow === "expired"
                ? "Tidak ada batch yang sudah kedaluwarsa dengan stok tersisa."
                : `Tidak ada batch yang kedaluwarsa dalam ${selectedWindowLabel.toLowerCase()}.`
            }
            title="Tidak Ada Data Kedaluwarsa"
          />
        )}
      </DataTableShell>

      {/* Block Confirmation Dialog */}
      <ConfirmDialog
        confirmLabel={blockMutation.isPending ? "Memblokir..." : "Blokir Batch"}
        description={
          <div className="grid gap-4">
            <p className="ts-sm text-text-muted">
              {blockTarget
                ? `Batch ${blockTarget.batchNumber} (${blockTarget.medicine.name}) akan diblokir dan tidak dapat dialokasikan ke transaksi baru. Tindakan ini akan dicatat dalam audit log.`
                : ""}
            </p>
            <section className="mt-2 text-left">
              <TextInput
                errorMessage={blockReasonError}
                id="block-reason"
                label="Alasan Pemblokiran"
                onChange={(e) => {
                  setBlockReason(e.target.value);
                  if (blockReasonError) setBlockReasonError("");
                }}
                placeholder="cth: Batch mendekati kedaluwarsa, perlu isolasi"
                required
                value={blockReason}
              />
            </section>
          </div>
        }
        id="block-batch-dialog"
        loading={blockMutation.isPending}
        onCancel={handleBlockCancel}
        onConfirm={handleBlockConfirm}
        open={blockTarget !== null}
        title="Blokir Batch?"
        variant="danger"
      />

    </>
  );
}
