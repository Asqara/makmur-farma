"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Loader2, MinusCircle } from "lucide-react";
import { useState } from "react";

import {
  ActionMenu,
  Button,
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  Dialog,
  EmptyState,
  ErrorState,
  SelectInput,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextareaInput,
  toast,
} from "@/components/ui";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type ErrorLogRow = {
  correlationId: string | null;
  createdAt: Date | string;
  id: string;
  resolvedAt: string | null;
  safeMessage: string;
  severity: "critical" | "info" | "warning";
  source: string;
};

type ErrorLogsResponse = {
  data: ErrorLogRow[];
};

type ErrorActionState = {
  id: string;
  source: string;
  action: "resolve" | "ignore";
} | null;

const severityTone = {
  critical: "danger",
  info: "info",
  warning: "warning",
} as const;

const SEVERITY_OPTIONS = [
  { label: "Semua Severity", value: "" },
  { label: "Critical", value: "critical" },
  { label: "Warning", value: "warning" },
  { label: "Info", value: "info" },
];

const STATUS_OPTIONS = [
  { label: "Semua Status", value: "" },
  { label: "Terbuka", value: "false" },
  { label: "Selesai", value: "true" },
];

export default function ErrorLogsPage() {
  const queryClient = useQueryClient();

  const [errorAction, setErrorAction] = useState<ErrorActionState>(null);
  const [note, setNote] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [resolvedFilter, setResolvedFilter] = useState("");

  const query = useQuery({
    queryFn: async () => {
      const queryParams: Record<string, string> = {
        limit: "30",
        page: "1",
        sortBy: "createdAt",
        sortDir: "desc",
      };

      if (severityFilter) queryParams.severity = severityFilter;
      if (resolvedFilter !== "") queryParams.resolved = resolvedFilter;

      const response = await eden.api.v1["error-logs"].get({
        query: queryParams,
      });

      if (response.error) throw response.error;

      return response.data as ErrorLogsResponse;
    },
    queryKey: ["error-logs", severityFilter, resolvedFilter],
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: "resolve" | "ignore" }) => {
      if (action === "resolve") {
        const response = await eden.api.v1["error-logs"]({ id }).resolve.post({ note });

        if (response.error) throw response.error;

        return response.data;
      } else {
        const response = await eden.api.v1["error-logs"]({ id }).ignore.post({ note });

        if (response.error) throw response.error;

        return response.data;
      }
    },
    onError: () => {
      toast.error("Gagal memperbarui status error log.");
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["error-logs"] });
      toast.success(
        action === "resolve"
          ? "Error log berhasil diselesaikan."
          : "Error log berhasil diabaikan.",
      );
      setErrorAction(null);
      setNote("");
    },
  });

  function openAction(row: ErrorLogRow, action: "resolve" | "ignore") {
    setNote("");
    setErrorAction({ id: row.id, source: row.source, action });
  }

  const isLoading = resolveMutation.isPending;

  const actionTitle =
    errorAction?.action === "resolve" ? "Selesaikan Error" : "Abaikan Error";
  const actionDescription =
    errorAction?.action === "resolve"
      ? `Tandai error dari "${errorAction?.source}" sebagai selesai ditangani.`
      : `Abaikan error dari "${errorAction?.source}". Error tidak akan muncul sebagai aktif.`;
  const confirmLabel = errorAction?.action === "resolve" ? "Selesaikan" : "Abaikan";

  return (
    <>
      <DataTableShell
        description="Error log menyimpan pesan aman dan detail diagnostik tetap dibatasi untuk role operasional."
        title="Error Log"
        toolbar={
          <>
            <SelectInput
              id="error-logs-severity"
              label="Severity"
              onValueChange={(v) => setSeverityFilter(v)}
              options={SEVERITY_OPTIONS}
              value={severityFilter}
            />
            <SelectInput
              id="error-logs-status"
              label="Status"
              onValueChange={(v) => setResolvedFilter(v)}
              options={STATUS_OPTIONS}
              value={resolvedFilter}
            />
          </>
        }
      >
        {query.isError ? (
          <ErrorState
            description="Error log gagal dimuat."
            onRetry={() => query.refetch()}
            title="Error Log Tidak Tersedia"
          />
        ) : query.data?.data.length ? (
          <Card>
            <CardContent>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Severity</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Pesan</TableHead>
                    <TableHead>Correlation</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Waktu</TableHead>
                    <TableHead>
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell>
                        <StatusBadge
                          label={error.severity}
                          tone={severityTone[error.severity]}
                        />
                      </TableCell>
                      <TableCell>{error.source}</TableCell>
                      <TableCell>{error.safeMessage}</TableCell>
                      <TableCell className="font-mono">
                        {error.correlationId ?? "-"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={error.resolvedAt ? "Selesai" : "Terbuka"}
                          tone={error.resolvedAt ? "success" : "warning"}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(error.createdAt)}</TableCell>
                      <TableCell>
                        {!error.resolvedAt && (
                          <ActionMenu
                            label={`Aksi untuk error ${error.id}`}
                            items={[
                              {
                                icon: <CheckCircle />,
                                label: "Selesaikan",
                                onSelect: () => openAction(error, "resolve"),
                              },
                              {
                                icon: <MinusCircle />,
                                label: "Abaikan",
                                onSelect: () => openAction(error, "ignore"),
                              },
                            ]}
                          />
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
              query.isLoading ? "Memuat error log..." : "Tidak ada error yang tercatat."
            }
            title={query.isLoading ? "Memuat" : "Error Log Kosong"}
          />
        )}
      </DataTableShell>

      {/* Resolve / Ignore Dialog */}
      <Dialog
        description={actionDescription}
        footer={
          <>
            <Button
              disabled={isLoading}
              onClick={() => {
                setErrorAction(null);
                setNote("");
              }}
              variant="secondary"
            >
              Batal
            </Button>
            <Button
              disabled={isLoading}
              leftIcon={isLoading ? <Loader2 className="animate-spin" /> : undefined}
              onClick={() => {
                if (!errorAction) return;
                resolveMutation.mutate({ id: errorAction.id, action: errorAction.action });
              }}
              variant={errorAction?.action === "resolve" ? "primary" : "danger"}
            >
              {confirmLabel}
            </Button>
          </>
        }
        id="error-log-action-dialog"
        onClose={() => {
          setErrorAction(null);
          setNote("");
        }}
        open={errorAction !== null}
        title={actionTitle}
      >
        <TextareaInput
          id="error-log-note"
          label="Catatan Resolusi"
          onChange={(e) => setNote(e.target.value)}
          placeholder="Tambahkan catatan penanganan (opsional)"
          rows={4}
          value={note}
        />
      </Dialog>
    </>
  );
}
