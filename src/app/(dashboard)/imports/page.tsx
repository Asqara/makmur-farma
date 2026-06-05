"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  ImportStepper,
  Progress,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  JOB_STATUS_LABELS,
  JOB_STATUS_TONES,
  type JobStatus,
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type ImportsResponse = {
  data: Array<{
    completedAt: Date | string | null;
    createdAt: Date | string;
    failedRows: number;
    id: string;
    originalFileName: string;
    processedRows: number;
    safeError: string | null;
    status: JobStatus;
    totalRows: number;
    type: string;
    validRows: number;
  }>;
};

export default function ImportsPage() {
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.imports.get({
        query: { limit: "30", page: "1" },
      });

      if (response.error) throw response.error;

      return response.data as ImportsResponse;
    },
    queryKey: ["imports"],
  });

  return (
    <DataTableShell
      description="Import CSV/Excel diproses bertahap: upload, mapping, validasi, konfirmasi, proses, hasil."
      title="Import Obat"
      toolbar={
        <ImportStepper
          steps={[
            { status: "completed", title: "Unggah File" },
            { status: "completed", title: "Petakan Kolom" },
            { status: "completed", title: "Validasi" },
            { status: "current", title: "Konfirmasi" },
            { status: "pending", title: "Proses" },
            { status: "pending", title: "Hasil" },
          ]}
        />
      }
    >
      {query.isError ? (
        <ErrorState
          description="Riwayat import gagal dimuat."
          onRetry={() => query.refetch()}
          title="Import Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rows</TableHead>
                  <TableHead>Progres</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((importRun) => (
                  <TableRow key={importRun.id}>
                    <TableCell>
                      <p className="font-medium text-text-strong">
                        {importRun.originalFileName}
                      </p>
                      <p className="ts-xs text-text-muted">{importRun.type}</p>
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={JOB_STATUS_LABELS[importRun.status]}
                        tone={JOB_STATUS_TONES[importRun.status]}
                      />
                    </TableCell>
                    <TableCell>
                      {importRun.validRows} valid / {importRun.failedRows} gagal
                    </TableCell>
                    <TableCell className="min-w-40">
                      <Progress
                        showValue
                        value={
                          importRun.totalRows
                            ? Math.round(
                                (importRun.processedRows / importRun.totalRows) *
                                  100,
                              )
                            : 0
                        }
                      />
                    </TableCell>
                    <TableCell>{importRun.safeError ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(importRun.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={query.isLoading ? "Memuat import..." : "Belum ada import."}
          title={query.isLoading ? "Memuat" : "Import Kosong"}
        />
      )}
    </DataTableShell>
  );
}
