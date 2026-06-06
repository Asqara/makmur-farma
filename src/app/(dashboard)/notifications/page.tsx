"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCheck, Loader2 } from "lucide-react";
import { useState } from "react";

import {
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  Pagination,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from "@/components/ui";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type NotificationRow = {
  actionHref: string | null;
  createdAt: Date | string;
  id: string;
  isRead: boolean;
  message: string;
  severity: "critical" | "info" | "success" | "warning";
  title: string;
  type: string;
};

type NotificationsResponse = {
  data: NotificationRow[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

const severityTone = {
  critical: "danger",
  info: "info",
  success: "success",
  warning: "warning",
} as const;
const PAGE_SIZE = 30;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.notifications.get({
        query: { limit: String(PAGE_SIZE), page: String(page) },
      });

      if (response.error) throw response.error;

      return response.data as NotificationsResponse;
    },
    queryKey: ["notifications", "page", page],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await eden.api.v1.notifications({ id }).read.post({});

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal menandai notifikasi sebagai dibaca.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Notifikasi ditandai sebagai dibaca.");
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.notifications["read-all"].post({});

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal menandai semua notifikasi sebagai dibaca.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Semua notifikasi ditandai sebagai dibaca.");
    },
  });

  const hasUnread = query.data?.data.some((n) => !n.isRead) ?? false;

  return (
    <DataTableShell
      description="Notifikasi in-app menjadi baseline delivery; email hanya tambahan bila terkonfigurasi."
      footer={
        query.data?.pagination ? (
          <section className="flex flex-wrap items-center justify-between gap-3">
            <p className="ts-sm text-text-muted">
              {query.data.pagination.total} notifikasi ditemukan
            </p>
            <Pagination
              currentPage={page}
              onPageChange={setPage}
              pageCount={Math.max(query.data.pagination.totalPages, 1)}
            />
          </section>
        ) : null
      }
      title="Notifikasi"
      toolbar={
        hasUnread ? (
          <Button
            disabled={markAllReadMutation.isPending}
            leftIcon={
              markAllReadMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <CheckCheck />
              )
            }
            onClick={() => markAllReadMutation.mutate()}
            size="sm"
            variant="secondary"
          >
            Tandai Semua Dibaca
          </Button>
        ) : undefined
      }
    >
      {query.isError ? (
        <ErrorState
          description="Notifikasi gagal dimuat."
          onRetry={() => query.refetch()}
          title="Notifikasi Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <p className="font-medium text-text-strong">
                        {notification.title}
                      </p>
                      <p className="ts-xs line-clamp-2 text-text-muted">
                        {notification.message}
                      </p>
                    </TableCell>
                    <TableCell>{notification.type}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={notification.severity}
                        tone={severityTone[notification.severity]}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        label={notification.isRead ? "Dibaca" : "Belum Dibaca"}
                        tone={notification.isRead ? "neutral" : "primary"}
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(notification.createdAt)}</TableCell>
                    <TableCell>
                      {!notification.isRead && (
                        <Button
                          disabled={markReadMutation.isPending}
                          leftIcon={
                            markReadMutation.isPending ? (
                              <Loader2 className="animate-spin" />
                            ) : undefined
                          }
                          onClick={() => markReadMutation.mutate(notification.id)}
                          size="sm"
                          variant="ghost"
                        >
                          Tandai Dibaca
                        </Button>
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
            query.isLoading ? "Memuat notifikasi..." : "Tidak ada notifikasi."
          }
          title={query.isLoading ? "Memuat" : "Notifikasi Kosong"}
        />
      )}
    </DataTableShell>
  );
}
