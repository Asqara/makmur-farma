"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import type { StockMovementType } from "@/constants/domain";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type MovementResponse = {
  data: Array<{
    actor: {
      name: string | null;
    };
    batchNumber: string;
    createdAt: Date | string;
    id: string;
    medicine: {
      code: string;
      name: string;
    };
    quantityDelta: number;
    reason: string;
    referenceId: string | null;
    referenceType: string | null;
    type: StockMovementType;
  }>;
};

export default function StockMovementsPage() {
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1["stock-movements"].get({
        query: { limit: "30", page: "1", sortBy: "createdAt", sortDir: "desc" },
      });

      if (response.error) throw response.error;

      return response.data as MovementResponse;
    },
    queryKey: ["stock-movements"],
  });

  return (
    <DataTableShell
      description="Semua perubahan stok wajib terekam sebagai movement, bukan edit angka langsung."
      title="Pergerakan Stok"
    >
      {query.isError ? (
        <ErrorState
          description="Pergerakan stok gagal dimuat."
          onRetry={() => query.refetch()}
          title="Movement Tidak Tersedia"
        />
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
                  <TableHead>Referensi</TableHead>
                  <TableHead>Aktor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((movement) => (
                  <TableRow key={movement.id}>
                    <TableCell>{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell>
                      <p className="font-medium text-text-strong">
                        {movement.medicine.name}
                      </p>
                      <p className="ts-xs text-text-muted">
                        {movement.medicine.code}
                      </p>
                    </TableCell>
                    <TableCell className="font-mono">{movement.batchNumber}</TableCell>
                    <TableCell>{movement.type}</TableCell>
                    <TableCell>{movement.quantityDelta}</TableCell>
                    <TableCell>
                      {movement.referenceType
                        ? `${movement.referenceType}:${movement.referenceId ?? "-"}`
                        : "-"}
                    </TableCell>
                    <TableCell>{movement.actor.name ?? "Sistem"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={query.isLoading ? "Memuat movement..." : "Belum ada movement stok."}
          title={query.isLoading ? "Memuat" : "Movement Kosong"}
        />
      )}
    </DataTableShell>
  );
}
