"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, ExternalLink, FileText } from "lucide-react";
import { useParams } from "next/navigation";

import {
  ButtonLink,
  ButtonExternalLink,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  OrderStatusBadge,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import {
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_TONES,
  type OrderStatus,
  type PrescriptionStatus,
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type PrescriptionDetailResponse = {
  contentType: string;
  customer: {
    email: string | null;
    id: string;
    name: string | null;
  };
  fileSizeBytes: number;
  id: string;
  latestNote: string | null;
  order: {
    id: string;
    orderNumber: string;
    status: OrderStatus;
  };
  originalFileName: string;
  reviews: Array<{
    decision: PrescriptionStatus;
    id: string;
    notes: string;
    pharmacist: {
      email: string | null;
      id: string;
      name: string | null;
    };
    reviewedAt: Date | string;
  }>;
  status: PrescriptionStatus;
  submittedAt: Date | string;
};

function formatFileSize(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const prescriptionId = params.id as string;
  const fileHref = `/api/v1/prescriptions/${prescriptionId}/file`;

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.prescriptions({ id: prescriptionId }).get();

      if (response.error) throw response.error;

      return response.data as PrescriptionDetailResponse;
    },
    queryKey: ["prescriptions", prescriptionId],
  });

  const prescription = query.data;

  return (
    <DataTableShell
      description="Detail resep dan file asli hanya tersedia untuk pengguna operasional yang berwenang."
      title="Detail Resep"
      toolbar={
        <section className="flex flex-wrap gap-2">
          <ButtonLink href="/prescriptions" leftIcon={<ArrowLeft />} variant="secondary">
            Kembali
          </ButtonLink>
          <ButtonExternalLink href={fileHref} leftIcon={<ExternalLink />} variant="secondary">
            Buka File
          </ButtonExternalLink>
          <ButtonExternalLink href={fileHref} leftIcon={<Download />} variant="primary">
            Unduh Resep
          </ButtonExternalLink>
        </section>
      }
    >
      {query.isError ? (
        <ErrorState
          description="Detail resep gagal dimuat atau Anda tidak memiliki akses."
          onRetry={() => query.refetch()}
          title="Resep Tidak Tersedia"
        />
      ) : prescription ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card>
            <CardHeader>
              <CardTitle>File Resep Asli</CardTitle>
              <CardDescription>
                File ditampilkan melalui endpoint internal terproteksi, bukan tautan publik.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <section className="overflow-hidden rounded-lg border border-border-default bg-muted-surface">
                <iframe
                  className="h-[70vh] min-h-[520px] w-full bg-card-surface"
                  src={fileHref}
                  title={`File resep ${prescription.originalFileName}`}
                />
              </section>
            </CardContent>
          </Card>

          <section className="grid gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Informasi Resep</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4">
                <section className="grid gap-1">
                  <p className="ts-xs text-text-muted">Status Resep</p>
                  <StatusBadge
                    label={PRESCRIPTION_STATUS_LABELS[prescription.status]}
                    tone={PRESCRIPTION_STATUS_TONES[prescription.status]}
                  />
                </section>
                <section className="grid gap-1">
                  <p className="ts-xs text-text-muted">Nomor Pesanan</p>
                  <p className="font-mono ts-sm text-text-strong">
                    {prescription.order.orderNumber}
                  </p>
                </section>
                <section className="grid gap-1">
                  <p className="ts-xs text-text-muted">Status Pesanan</p>
                  <OrderStatusBadge status={prescription.order.status} />
                </section>
                <section className="grid gap-1">
                  <p className="ts-xs text-text-muted">Pelanggan</p>
                  <p className="ts-sm font-medium text-text-strong">
                    {prescription.customer.name ?? "Pelanggan"}
                  </p>
                  <p className="ts-xs text-text-muted">
                    {prescription.customer.email ?? "-"}
                  </p>
                </section>
                <section className="grid gap-1">
                  <p className="ts-xs text-text-muted">File</p>
                  <p className="ts-sm text-text-strong">
                    {prescription.originalFileName}
                  </p>
                  <p className="ts-xs text-text-muted">
                    {prescription.contentType} · {formatFileSize(prescription.fileSizeBytes)}
                  </p>
                </section>
                <section className="grid gap-1">
                  <p className="ts-xs text-text-muted">Dikirim</p>
                  <p className="ts-sm text-text-strong">
                    {formatDateTime(prescription.submittedAt)}
                  </p>
                </section>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Riwayat Tinjauan</CardTitle>
              </CardHeader>
              <CardContent>
                {prescription.reviews.length ? (
                  <DataTable dense>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Keputusan</TableHead>
                        <TableHead>Apoteker</TableHead>
                        <TableHead>Waktu</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescription.reviews.map((review) => (
                        <TableRow key={review.id}>
                          <TableCell>
                            <StatusBadge
                              label={PRESCRIPTION_STATUS_LABELS[review.decision]}
                              tone={PRESCRIPTION_STATUS_TONES[review.decision]}
                            />
                            <p className="mt-2 ts-xs text-text-muted">{review.notes}</p>
                          </TableCell>
                          <TableCell>{review.pharmacist.name ?? "-"}</TableCell>
                          <TableCell>{formatDateTime(review.reviewedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </DataTable>
                ) : (
                  <EmptyState
                    description="Belum ada keputusan apoteker untuk resep ini."
                    icon={<FileText />}
                    title="Belum Ditinjau"
                  />
                )}
              </CardContent>
            </Card>
          </section>
        </section>
      ) : (
        <EmptyState description="Memuat detail resep..." title="Memuat" />
      )}
    </DataTableShell>
  );
}
