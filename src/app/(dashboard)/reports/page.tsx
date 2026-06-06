"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileDown,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  Button,
  ButtonLink,
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableShell,
  DateInput,
  EmptyState,
  ErrorState,
  Pagination,
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
    filters: Record<string, unknown>;
    filename: string | null;
    id: string;
    progress: number;
    safeError: string | null;
    startedAt: Date | string | null;
    status: JobStatus;
    type: string;
  }>;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

const EMPTY_REPORTS: ReportsResponse["data"] = [];
const PAGE_SIZE = 30;

const REPORT_TYPE_OPTIONS = [
  { label: "Laporan Penjualan", value: "SALES" },
  { label: "Ringkasan Transaksi", value: "TRANSACTION_SUMMARY" },
] as const;

const REPORT_TYPE_LABELS = Object.fromEntries(
  REPORT_TYPE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

function getDefaultDateRange() {
  const today = new Date();
  const from = new Date(today);
  from.setDate(today.getDate() - 30);

  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
}

function getReportTypeLabel(type: string) {
  return REPORT_TYPE_LABELS[type] ?? type;
}

function getReportPeriod(filters: Record<string, unknown>) {
  const from = typeof filters.from === "string" ? filters.from : null;
  const to = typeof filters.to === "string" ? filters.to : null;

  if (from && to) return `${from} sampai ${to}`;
  if (from) return `Mulai ${from}`;
  if (to) return `Sampai ${to}`;

  return "Semua periode";
}

function formatFileSize(value: number | null) {
  if (!value) return "Dibuat saat download";

  if (value < 1024 * 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isActiveStatus(status: JobStatus) {
  return status === "QUEUED" || status === "PROCESSING";
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [reportType, setReportType] = useState("SALES");
  const [dateRange, setDateRange] = useState(getDefaultDateRange);

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.reports.get({
        query: { limit: String(PAGE_SIZE), page: String(page) },
      });

      if (response.error) throw response.error;

      return response.data as ReportsResponse;
    },
    queryKey: ["reports", page],
    refetchInterval: 5_000,
  });

  const reports = query.data?.data ?? EMPTY_REPORTS;
  const latestReport = reports[0] ?? null;
  const reportStats = useMemo(() => {
    return {
      active: reports.filter((report) => isActiveStatus(report.status)).length,
      completed: reports.filter((report) => report.status === "COMPLETED").length,
      failed: reports.filter((report) => report.status === "FAILED").length,
      total: reports.length,
    };
  }, [reports]);

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
      toast.error("Export laporan gagal dibuat.");
    },
    onSuccess: () => {
      toast.success("Export laporan dibuat. PDF akan dibuat di memori saat download.");
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      setPage(1);
    },
  });

  return (
    <DataTableShell
      description="Laporan dihitung dari data transaksi, PDF tidak disimpan permanen, dan file dibuat ulang di memori saat download."
      footer={
        query.data?.pagination ? (
          <section className="flex flex-wrap items-center justify-between gap-3">
            <p className="ts-sm text-text-muted">
              {query.data.pagination.total} laporan ditemukan
            </p>
            <Pagination
              currentPage={page}
              onPageChange={setPage}
              pageCount={Math.max(query.data.pagination.totalPages, 1)}
            />
          </section>
        ) : null
      }
      title="Laporan Penjualan"
    >
      <section className="grid gap-5">
        <section className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="grid size-10 place-items-center rounded-lg bg-primary-blue-soft text-primary-blue">
                <FileText aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <p className="ts-xs text-text-muted">Total Riwayat</p>
                <p className="ts-xl font-semibold text-text-strong">
                  {reportStats.total}
                </p>
              </section>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="grid size-10 place-items-center rounded-lg bg-info-bg text-info">
                <Clock3 aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <p className="ts-xs text-text-muted">Berjalan</p>
                <p className="ts-xl font-semibold text-text-strong">
                  {reportStats.active}
                </p>
              </section>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="grid size-10 place-items-center rounded-lg bg-success-bg text-success">
                <CheckCircle2 aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <p className="ts-xs text-text-muted">Selesai</p>
                <p className="ts-xl font-semibold text-text-strong">
                  {reportStats.completed}
                </p>
              </section>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <span className="grid size-10 place-items-center rounded-lg bg-danger-bg text-danger">
                <AlertTriangle aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <p className="ts-xs text-text-muted">Gagal</p>
                <p className="ts-xl font-semibold text-text-strong">
                  {reportStats.failed}
                </p>
              </section>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
          <Card>
            <CardHeader>
              <section className="grid gap-1">
                <CardTitle>Export Laporan PDF</CardTitle>
                <CardDescription>
                  Pilih jenis dan periode laporan. Sistem menghitung metadata,
                  lalu PDF siap diunduh tanpa file permanen.
                </CardDescription>
              </section>
            </CardHeader>
            <CardContent>
              <section className="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,360px)]">
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
              </section>
              <section className="mt-5 flex flex-wrap items-center gap-3">
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
                <Button
                  disabled={query.isFetching}
                  leftIcon={
                    query.isFetching ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <RefreshCw />
                    )
                  }
                  onClick={() => query.refetch()}
                  type="button"
                  variant="secondary"
                >
                  Refresh Riwayat
                </Button>
              </section>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <section className="grid gap-1">
                <CardTitle>Hasil Terbaru</CardTitle>
                <CardDescription>
                  Ringkasan report terakhir dan aksi download ketika selesai.
                </CardDescription>
              </section>
            </CardHeader>
            <CardContent>
              {latestReport ? (
                <section className="grid gap-4">
                  <section className="flex items-start justify-between gap-3">
                    <section className="grid gap-1">
                      <p className="ts-base font-semibold text-text-strong">
                        {getReportTypeLabel(latestReport.type)}
                      </p>
                      <p className="ts-sm text-text-muted">
                        {getReportPeriod(latestReport.filters)}
                      </p>
                    </section>
                    <StatusBadge
                      label={JOB_STATUS_LABELS[latestReport.status]}
                      tone={JOB_STATUS_TONES[latestReport.status]}
                    />
                  </section>

                  <Progress showValue value={latestReport.progress} />

                  <section className="grid gap-2 rounded-lg border border-border-default bg-muted-surface p-3">
                    <section className="flex items-center justify-between gap-3">
                      <span className="ts-sm text-text-muted">Dibuat</span>
                      <span className="ts-sm font-medium text-text-strong">
                        {formatDateTime(latestReport.createdAt)}
                      </span>
                    </section>
                    <section className="flex items-center justify-between gap-3">
                      <span className="ts-sm text-text-muted">Ukuran</span>
                      <span className="ts-sm font-medium text-text-strong">
                        {formatFileSize(latestReport.fileSizeBytes)}
                      </span>
                    </section>
                    <section className="flex items-center justify-between gap-3">
                      <span className="ts-sm text-text-muted">Penyimpanan</span>
                      <span className="ts-sm font-medium text-text-strong">
                        In-memory saat download
                      </span>
                    </section>
                  </section>

                  {latestReport.safeError ? (
                    <p className="rounded-lg border border-danger-border bg-danger-bg px-3 py-2 ts-sm text-danger">
                      {latestReport.safeError}
                    </p>
                  ) : null}

                  {latestReport.status === "COMPLETED" ? (
                    <ButtonLink
                      href={`/api/v1/reports/${latestReport.id}/download`}
                      leftIcon={<FileDown aria-hidden="true" />}
                      variant="primary"
                    >
                      Download PDF
                    </ButtonLink>
                  ) : null}
                </section>
              ) : (
                <EmptyState
                  description={
                    query.isLoading
                      ? "Memuat laporan..."
                      : "Belum ada laporan yang dibuat."
                  }
                  title={query.isLoading ? "Memuat" : "Belum Ada Hasil"}
                />
              )}
            </CardContent>
          </Card>
        </section>

        {query.isError ? (
          <ErrorState
            description="Riwayat laporan gagal dimuat."
            onRetry={() => query.refetch()}
            title="Laporan Tidak Tersedia"
          />
        ) : reports.length ? (
          <Card>
            <CardHeader>
              <section className="grid gap-1">
                <CardTitle>Riwayat Export</CardTitle>
                <CardDescription>
                  Metadata report tetap disimpan untuk audit. PDF dibuat ulang
                  dari database saat tombol download ditekan.
                </CardDescription>
              </section>
            </CardHeader>
            <CardContent>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progres</TableHead>
                    <TableHead>Output</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>Selesai</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <p className="font-medium text-text-strong">
                          {getReportTypeLabel(report.type)}
                        </p>
                        <p className="ts-xs text-text-muted">
                          {report.filename ?? `laporan-${report.id.slice(0, 8)}`}
                        </p>
                      </TableCell>
                      <TableCell>{getReportPeriod(report.filters)}</TableCell>
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
                        {report.safeError ? (
                          <span className="text-danger">{report.safeError}</span>
                        ) : (
                          formatFileSize(report.fileSizeBytes)
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(report.createdAt)}</TableCell>
                      <TableCell>
                        {report.completedAt
                          ? formatDateTime(report.completedAt)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {report.status === "COMPLETED" ? (
                          <ButtonLink
                            href={`/api/v1/reports/${report.id}/download`}
                            leftIcon={<FileDown aria-hidden="true" />}
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
