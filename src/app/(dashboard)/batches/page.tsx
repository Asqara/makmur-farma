"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
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
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime, formatStockQuantity } from "@/utils/inventoryDisplay";

type BatchResponse = {
  data: Array<{
    availableQuantity: number;
    batchNumber: string;
    expiryDate: Date | string;
    id: string;
    medicine: {
      code: string;
      name: string;
      unit: string;
    };
    purchaseCost: string;
    receivedDate: Date | string;
    reservedQuantity: number;
    status: BatchStatus;
    supplier: {
      name: string | null;
    };
  }>;
};

export default function BatchesPage() {
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.batches.get({
        query: { limit: "30", page: "1", sortBy: "expiryDate", sortDir: "asc" },
      });

      if (response.error) throw response.error;

      return response.data as BatchResponse;
    },
    queryKey: ["batches"],
  });

  return (
    <DataTableShell
      description="Stok operasional berasal dari batch dengan tanggal terima dan kedaluwarsa."
      title="Batch dan Stok"
    >
      {query.isError ? (
        <ErrorState
          description="Batch gagal dimuat."
          onRetry={() => query.refetch()}
          title="Batch Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch</TableHead>
                  <TableHead>Obat</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Tersedia</TableHead>
                  <TableHead>Reserved</TableHead>
                  <TableHead>Kedaluwarsa</TableHead>
                  <TableHead>Harga Beli</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                    <TableCell>
                      <p className="font-medium text-text-strong">
                        {batch.medicine.name}
                      </p>
                      <p className="ts-xs text-text-muted">
                        {batch.medicine.code}
                      </p>
                    </TableCell>
                    <TableCell>{batch.supplier.name ?? "-"}</TableCell>
                    <TableCell>
                      {formatStockQuantity(
                        batch.availableQuantity,
                        batch.medicine.unit,
                      )}
                    </TableCell>
                    <TableCell>
                      {formatStockQuantity(
                        batch.reservedQuantity,
                        batch.medicine.unit,
                      )}
                    </TableCell>
                    <TableCell>{formatDateTime(batch.expiryDate)}</TableCell>
                    <TableCell>{formatRp(Number(batch.purchaseCost))}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={BATCH_STATUS_LABELS[batch.status]}
                        tone={BATCH_STATUS_TONES[batch.status]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={query.isLoading ? "Memuat batch..." : "Belum ada batch stok."}
          title={query.isLoading ? "Memuat" : "Batch Kosong"}
        />
      )}
    </DataTableShell>
  );
}
