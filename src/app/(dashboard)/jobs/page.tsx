"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import {
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  Pagination,
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
  type JobType,
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type JobsResponse = {
  data: Array<{
    attempt: number;
    completedAt: Date | string | null;
    createdAt: Date | string;
    entityId: string | null;
    entityType: string | null;
    id: string;
    jobKey: string;
    jobType: JobType;
    maxAttempts: number;
    progress: number;
    queueName: string;
    safeError: string | null;
    status: JobStatus;
  }>;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

const PAGE_SIZE = 30;

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.jobs.get({
        query: {
          limit: String(PAGE_SIZE),
          page: String(page),
          sortBy: "createdAt",
          sortDir: "desc",
        },
      });

      if (response.error) throw response.error;

      return response.data as JobsResponse;
    },
    queryKey: ["jobs", page],
  });

  return (
    <DataTableShell
      description="Job status disimpan di PostgreSQL agar retry, final failure, dan progres dapat diaudit."
      footer={
        query.data?.pagination ? (
          <section className="flex flex-wrap items-center justify-between gap-3">
            <p className="ts-sm text-text-muted">
              {query.data.pagination.total} job ditemukan
            </p>
            <Pagination
              currentPage={page}
              onPageChange={setPage}
              pageCount={Math.max(query.data.pagination.totalPages, 1)}
            />
          </section>
        ) : null
      }
      title="Job"
    >
      {query.isError ? (
        <ErrorState
          description="Job gagal dimuat."
          onRetry={() => query.refetch()}
          title="Job Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Key</TableHead>
                  <TableHead>Queue</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempt</TableHead>
                  <TableHead>Progres</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Dibuat</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono">{job.jobKey}</TableCell>
                    <TableCell>{job.queueName}</TableCell>
                    <TableCell>{job.jobType}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={JOB_STATUS_LABELS[job.status]}
                        tone={JOB_STATUS_TONES[job.status]}
                      />
                    </TableCell>
                    <TableCell>
                      {job.attempt}/{job.maxAttempts}
                    </TableCell>
                    <TableCell className="min-w-40">
                      <Progress showValue value={job.progress} />
                    </TableCell>
                    <TableCell>{job.safeError ?? "-"}</TableCell>
                    <TableCell>{formatDateTime(job.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={query.isLoading ? "Memuat job..." : "Belum ada job run."}
          title={query.isLoading ? "Memuat" : "Job Kosong"}
        />
      )}
    </DataTableShell>
  );
}
