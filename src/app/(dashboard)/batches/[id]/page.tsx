"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import {
  ButtonLink,
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
  type BatchStatus,
  type StockMovementType,
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime } from "@/utils/inventoryDisplay";

type BatchDetail = {
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

type MovementItem = {
  actor: { id: string | null; name: string | null };
  batchNumber: string;
  createdAt: Date | string;
  id: string;
  medicine: { code: string; id: string; name: string };
  quantityDelta: number;
  reason: string;
  referenceId: string | null;
  referenceType: string | null;
  type: StockMovementType;
};

type MovementsResponse = {
  data: MovementItem[];
};

const MOVEMENT_TYPE_LABELS: Record<StockMovementType, string> = {
  ADJUSTMENT: "Penyesuaian",
  CANCELLATION_RELEASE: "Pelepasan Batal",
  DISPOSAL: "Disposal",
  IMPORT_OPENING: "Saldo Awal",
  RECEIPT: "Penerimaan",
  RESERVATION: "Reservasi",
  RESERVATION_RELEASE: "Pelepasan Reservasi",
  RETURN: "Retur",
  SALE: "Penjualan",
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <section className="grid grid-cols-2 gap-2 border-b border-border-subtle py-2 last:border-0 md:grid-cols-3">
      <span className="ts-sm font-medium text-text-muted">{label}</span>
      <span className="ts-sm col-span-1 text-text-strong md:col-span-2">{value}</span>
    </section>
  );
}

export default function BatchDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  const batchQuery = useQuery({
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await eden.api.v1.batches({ id }).get();

      if (response.error) throw response.error;

      return response.data as BatchDetail;
    },
    queryKey: ["batch", id],
  });

  const movementsQuery = useQuery({
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await eden.api.v1["stock-movements"].get({
        query: {
          limit: "50",
          page: "1",
          sortBy: "createdAt",
          sortDir: "desc",
        },
      });

      if (response.error) throw response.error;

      const raw = response.data as MovementsResponse;

      return raw;
    },
    queryKey: ["stock-movements-batch", id],
  });

  const batch = batchQuery.data;

  return (
    <DataTableShell
      description="Rincian batch stok dan histori pergerakan stok."
      title={batch ? `Batch ${batch.batchNumber}` : "Detail Batch"}
      toolbar={
        <ButtonLink
          href="/batches"
          leftIcon={<ArrowLeft />}
          variant="secondary"
        >
          Kembali
        </ButtonLink>
      }
    >
      {batchQuery.isError ? (
        <ErrorState
          description="Detail batch gagal dimuat."
          onRetry={() => batchQuery.refetch()}
          title="Batch Tidak Tersedia"
        />
      ) : batchQuery.isLoading ? (
        <section className="grid gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </section>
      ) : batch ? (
        <section className="grid gap-6">
          {/* Batch Info Card */}
          <Card>
            <CardContent>
              <section className="mb-4 flex items-start justify-between gap-4">
                <section>
                  <h2 className="font-semibold text-text-strong ts-lg">
                    {batch.medicine.name}
                  </h2>
                  <p className="ts-sm text-text-muted">{batch.medicine.code}</p>
                </section>
                <StatusBadge
                  label={BATCH_STATUS_LABELS[batch.status]}
                  tone={BATCH_STATUS_TONES[batch.status]}
                />
              </section>

              <section className="divide-y divide-border-subtle">
                <InfoRow label="Nomor Batch" value={batch.batchNumber} />
                <InfoRow
                  label="Supplier"
                  value={batch.supplier.name ?? "—"}
                />
                <InfoRow
                  label="Tanggal Terima"
                  value={formatDateTime(batch.receivedDate)}
                />
                <InfoRow
                  label="Tanggal Kedaluwarsa"
                  value={formatDateTime(batch.expiryDate)}
                />
                <InfoRow
                  label="Harga Beli"
                  value={formatRp(Number(batch.purchaseCost))}
                />
                <InfoRow
                  label="Stok Tersedia"
                  value={`${batch.availableQuantity} ${batch.medicine.unit}`}
                />
                <InfoRow
                  label="Stok Reserved"
                  value={`${batch.reservedQuantity} ${batch.medicine.unit}`}
                />
              </section>
            </CardContent>
          </Card>

          {/* Stock Movements Card */}
          <section>
            <h3 className="font-semibold text-text-strong mb-3 ts-base">
              Histori Pergerakan Stok
            </h3>
            {movementsQuery.isError ? (
              <ErrorState
                description="Histori pergerakan stok gagal dimuat."
                onRetry={() => movementsQuery.refetch()}
                title="Pergerakan Stok Tidak Tersedia"
              />
            ) : movementsQuery.data?.data.filter(
                (m) => m.batchNumber === batch.batchNumber,
              ).length ? (
              <Card>
                <CardContent>
                  <DataTable>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead>Delta</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>Aktor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movementsQuery.data.data
                        .filter((m) => m.batchNumber === batch.batchNumber)
                        .map((movement) => (
                          <TableRow key={movement.id}>
                            <TableCell className="ts-sm">
                              {formatDateTime(movement.createdAt)}
                            </TableCell>
                            <TableCell>
                              {MOVEMENT_TYPE_LABELS[movement.type] ?? movement.type}
                            </TableCell>
                            <TableCell
                              className={
                                movement.quantityDelta >= 0
                                  ? "font-medium text-success-default"
                                  : "font-medium text-danger-default"
                              }
                            >
                              {movement.quantityDelta >= 0 ? "+" : ""}
                              {movement.quantityDelta}
                            </TableCell>
                            <TableCell className="ts-sm">{movement.reason}</TableCell>
                            <TableCell className="ts-sm">
                              {movement.actor.name ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </DataTable>
                </CardContent>
              </Card>
            ) : (
              <EmptyState
                description={
                  movementsQuery.isLoading
                    ? "Memuat histori..."
                    : "Belum ada pergerakan stok untuk batch ini."
                }
                title={
                  movementsQuery.isLoading ? "Memuat" : "Histori Kosong"
                }
              />
            )}
          </section>
        </section>
      ) : null}
    </DataTableShell>
  );
}
