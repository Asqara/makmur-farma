"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";

import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableShell,
  DateInput,
  EmptyState,
  ErrorState,
  Progress,
  SelectInput,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
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

const REPORT_TYPE_OPTIONS = [
  { label: "Laporan Penjualan", value: "SALES" },
  { label: "Ringkasan Transaksi", value: "TRANSACTION_SUMMARY" },
] as const;

function getDefaultDateRange() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 30);

  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState("SALES");
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

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

  const exportMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.reports.post({
        filters: {
          from: dateRange.from || undefined,
          to: dateRange.to || undefined,
        },
        type: reportType,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Export laporan gagal dimasukkan ke antrean.");
    },
    onSuccess: () => {
      toast.success("Export laporan dibuat. Pantau progres di riwayat laporan.");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  return (
    <DataTableShell
      description="Laporan besar dibuat melalui background job dan menyimpan metadata download."
      title="Laporan Penjualan"
    >
      <section className="grid gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Export Laporan PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <section className="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,360px)_auto] lg:items-end">
              <SelectInput
                id="report-type"
                label="Jenis Laporan"
                onValueChange={setReportType}
                options={[...REPORT_TYPE_OPTIONS]}
                value={reportType}
              />
              <DateInput
                id="report-date-range"
                label="Rentang Tanggal"
                mode="range"
                onValueChange={setDateRange}
                placeholder="Pilih rentang tanggal"
                value={dateRange}
              />
              <Button
                disabled={exportMutation.isPending}
                leftIcon={
                  exportMutation.isPending ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    <FileDown />
                  )
                }
                onClick={() => exportMutation.mutate()}
                type="button"
              >
                {exportMutation.isPending ? "Membuat Export..." : "Export PDF"}
              </Button>
            </section>
          </CardContent>
        </Card>

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
                    <TableHead>Aksi</TableHead>
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
                      <TableCell>
                        {report.filename ?? report.safeError ?? "-"}
                      </TableCell>
                      <TableCell>{formatDateTime(report.createdAt)}</TableCell>
                      <TableCell>
                        {report.completedAt
                          ? formatDateTime(report.completedAt)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {report.status === "COMPLETED" && report.filename ? (
                          <ButtonLink
                            href={`/api/v1/reports/${report.id}/download`}
                            size="sm"
                            variant="secondary"
                          >
                            Download
                          </ButtonLink>
                        ) : (
                          "-"
                        )}
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
              query.isLoading
                ? "Memuat laporan..."
                : "Belum ada laporan yang dibuat."
            }
            title={query.isLoading ? "Memuat" : "Laporan Kosong"}
          />
        )}
      </section>
    </DataTableShell>
  );
}
