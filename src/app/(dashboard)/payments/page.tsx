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
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONES,
  type PaymentStatus,
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime } from "@/utils/inventoryDisplay";

type PaymentsResponse = {
  data: Array<{
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
  }>;
};

export default function PaymentsPage() {
  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.payments.get({
        query: { limit: "30", page: "1", sortBy: "createdAt", sortDir: "desc" },
      });

      if (response.error) throw response.error;

      return response.data as PaymentsResponse;
    },
    queryKey: ["payments"],
  });

  return (
    <DataTableShell
      description="Status pembayaran dipisahkan dari status pesanan dan tidak dipercaya dari redirect frontend."
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
    </DataTableShell>
  );
}
