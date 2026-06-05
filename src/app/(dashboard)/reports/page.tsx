"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
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

type ReportsResponse = {
  data: Array<{
    completedAt: Date | string | null;
    createdAt: Date | string;
    fileSizeBytes: number | null;
    filename: string | null;
    id: string;
    progress: number;
    safeError: string | null;
    status: JobStatus;
    type: string;
  }>;
};

export default function ReportsPage() {
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.reports.get({
        query: { limit: "30", page: "1" },
      });

      if (response.error) throw response.error;

      return response.data as ReportsResponse;
    },
    queryKey: ["reports"],
  });

  return (
    <DataTableShell
      description="Laporan besar dibuat melalui background job dan menyimpan metadata download."
      title="Laporan Penjualan"
    >
      {query.isError ? (
        <ErrorState
          description="Riwayat laporan gagal dimuat."
          onRetry={() => query.refetch()}
          title="Laporan Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Jenis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progres</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Selesai</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.type}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={JOB_STATUS_LABELS[report.status]}
                        tone={JOB_STATUS_TONES[report.status]}
                      />
                    </TableCell>
                    <TableCell className="min-w-40">
                      <Progress showValue value={report.progress} />
                    </TableCell>
                    <TableCell>{report.filename ?? report.safeError ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(report.createdAt)}</TableCell>
                    <TableCell>
                      {report.completedAt ? formatDateTime(report.completedAt) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={query.isLoading ? "Memuat laporan..." : "Belum ada laporan yang dibuat."}
          title={query.isLoading ? "Memuat" : "Laporan Kosong"}
        />
      )}
    </DataTableShell>
  );
}
