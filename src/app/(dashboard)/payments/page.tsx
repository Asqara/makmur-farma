"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Loader2, ShieldAlert } from "lucide-react";
import { useState } from "react";

import {
  ActionMenu,
  Button,
  ButtonLink,
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  Pagination,
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
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  type PaymentStatus,
} from "@/constants/domain";
import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime } from "@/utils/inventoryDisplay";

type PaymentRow = {
  amount: string;
  createdAt: Date | string;
  id: string;
  method: string;
  order: {
    orderNumber: string;
  };
  provider: string;
  providerReference: string | null;
  status: PaymentStatus;
};

type PaymentsResponse = {
  data: PaymentRow[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};

const PAGE_SIZE = 30;

export default function PaymentsPage() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const isAdmin = auth.data?.user.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [overridePayment, setOverridePayment] = useState<PaymentRow | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<"PAID" | "CANCELLED" | "REFUNDED">("PAID");
  const [overrideReason, setOverrideReason] = useState("");

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.payments.get({
        query: {
          limit: String(PAGE_SIZE),
          page: String(page),
          sortBy: "createdAt",
          sortDir: "desc",
        },
      });

      if (response.error) throw response.error;

      return response.data as PaymentsResponse;
    },
    queryKey: ["payments", page],
  });

  const overrideMutation = useMutation({
    mutationFn: async () => {
      if (!overridePayment) return;
      const response = await eden.api.v1.payments({ id: overridePayment.id }).override.post({
        overrideStatus,
        reason: overrideReason,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onSuccess: () => {
      toast.success("Override pembayaran berhasil.");
      setOverridePayment(null);
      setOverrideReason("");
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error: any) => {
      toast.error(error?.publicMessage || "Gagal melakukan override.");
    },
  });

  return (
    <DataTableShell
      description="Status pembayaran dipisahkan dari status pesanan dan tidak dipercaya dari redirect frontend."
      footer={
        query.data?.pagination ? (
          <section className="flex flex-wrap items-center justify-between gap-3">
            <p className="ts-sm text-text-muted">
              {query.data.pagination.total} pembayaran ditemukan
            </p>
            <Pagination
              currentPage={page}
              onPageChange={setPage}
              pageCount={Math.max(query.data.pagination.totalPages, 1)}
            />
          </section>
        ) : null
      }
      title="Pembayaran"
    >
      {query.isError ? (
        <ErrorState
          description="Pembayaran gagal dimuat."
          onRetry={() => query.refetch()}
          title="Pembayaran Tidak Tersedia"
        />
      ) : query.data?.data.length ? (
        <Card>
          <CardContent>
            <DataTable>
              <TableHeader>
                <TableRow>
                  <TableHead>Pesanan</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.data.data.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-mono">
                      {payment.order.orderNumber}
                    </TableCell>
                    <TableCell>{payment.provider}</TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell className="font-mono">
                      {payment.providerReference ?? "-"}
                    </TableCell>
                    <TableCell>{formatRp(Number(payment.amount))}</TableCell>
                    <TableCell>
                      <StatusBadge
                        label={PAYMENT_STATUS_LABELS[payment.status]}
                        tone={PAYMENT_STATUS_TONES[payment.status]}
                      />
                    </TableCell>
                    <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                    <TableCell>
                      <section className="flex items-center gap-2">
                        <ButtonLink
                          href={ROUTES.PAYMENTS.DETAIL(payment.id)}
                          size="sm"
                          variant="secondary"
                        >
                          Detail
                        </ButtonLink>
                        
                        {isAdmin && (
                          <ActionMenu
                            items={[
                              {
                                icon: <ShieldAlert className="text-warning" />,
                                label: "Override Status",
                                onSelect: () => {
                                  setOverridePayment(payment);
                                  setOverrideStatus("PAID");
                                },
                              },
                            ]}
                          />
                        )}
                      </section>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          description={query.isLoading ? "Memuat pembayaran..." : "Belum ada pembayaran."}
          title={query.isLoading ? "Memuat" : "Pembayaran Kosong"}
        />
      )}

      {overridePayment && (
        <ConfirmDialog
          confirmLabel={overrideMutation.isPending ? "Memproses..." : "Simpan Override"}
          description={
            <section className="grid gap-4 pt-4">
               <p className="ts-sm text-text-muted">
                Mengubah status pembayaran secara manual untuk pesanan <strong>{overridePayment.order.orderNumber}</strong>. Tindakan ini akan dicatat dalam audit log.
               </p>
               <SelectInput
                  id="target-status"
                  label="Status Baru"
                  onValueChange={(v) => setOverrideStatus(v as any)}
                  options={[
                    { label: "Lunas (PAID)", value: "PAID" },
                    { label: "Batal (CANCELLED)", value: "CANCELLED" },
                    { label: "Refund (REFUNDED)", value: "REFUNDED" },
                  ]}
                  value={overrideStatus}
               />
               <section className="grid gap-1.5">
                  <label className="ts-xs font-bold uppercase tracking-wider text-text-muted" htmlFor="reason">Alasan Perubahan</label>
                  <textarea
                    className="min-h-20 w-full rounded-md border border-border-default bg-card-surface p-2 ts-sm focus:outline-none focus:ring-2 focus:ring-primary-blue-base"
                    id="reason"
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Wajib diisi (minimal 5 karakter)..."
                    value={overrideReason}
                  />
               </section>
            </section>
          }
          disabled={overrideMutation.isPending || overrideReason.trim().length < 5}
          id="payment-override-dialog"
          onCancel={() => setOverridePayment(null)}
          onConfirm={() => overrideMutation.mutate()}
          open={!!overridePayment}
          title="Override Pembayaran (Admin Only)"
          variant={overrideStatus === "PAID" ? "info" : "danger"}
        />
      )}
    </DataTableShell>
  );
}
