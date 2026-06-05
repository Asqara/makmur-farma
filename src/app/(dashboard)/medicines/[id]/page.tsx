"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Pencil } from "lucide-react";
import { use } from "react";

import {
  Badge,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTableShell,
  ErrorState,
  Skeleton,
  StatusBadge,
} from "@/components/ui";
import {
  MEDICINE_STATUS_LABELS,
  MEDICINE_STATUS_TONES,
  type MedicineStatus,
} from "@/constants/domain";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime, formatStockQuantity } from "@/utils/inventoryDisplay";

type MedicineDetail = {
  category: {
    id: string | null;
    name: string | null;
    slug: string | null;
  };
  code: string;
  createdAt: Date | string;
  criticalStockThreshold: number;
  id: string;
  lowStockThreshold: number;
  name: string;
  prescriptionRequired: boolean;
  primaryImageUrl: string | null;
  sellingPrice: string;
  slug: string;
  status: MedicineStatus;
  totalAvailable: number;
  totalReserved: number;
  unit: string;
};

function stockTone(totalAvailable: number, low: number, critical: number) {
  if (totalAvailable <= 0) return "danger";
  if (totalAvailable <= critical) return "danger";
  if (totalAvailable <= low) return "warning";
  return "success";
}

function stockLabel(totalAvailable: number, low: number, critical: number) {
  if (totalAvailable <= 0) return "Habis";
  if (totalAvailable <= critical) return "Stok Kritis";
  if (totalAvailable <= low) return "Stok Rendah";
  return "Tersedia";
}

type DetailRowProps = {
  label: string;
  value: React.ReactNode;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <section className="grid grid-cols-[180px_1fr] items-start gap-2 py-3 border-b border-border-default last:border-b-0">
      <span className="ts-sm font-medium text-text-muted">{label}</span>
      <span className="ts-sm text-text-default">{value}</span>
    </section>
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Medicine detail page showing all master data fields with stock status.
 */
export default function MedicineDetailPage({ params }: PageProps) {
  const { id } = use(params);

  const medicineQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.medicines({ id }).get();

      if (response.error) throw response.error;

      return response.data as MedicineDetail;
    },
    queryKey: ["medicines", id],
    retry: (failureCount, error) => {
      const status =
        error &&
        typeof error === "object" &&
        "status" in error &&
        typeof (error as { status?: number }).status === "number"
          ? (error as { status: number }).status
          : null;

      if (status === 404) return false;

      return failureCount < 1;
    },
  });

  const medicine = medicineQuery.data;

  const isNotFound =
    medicineQuery.isError &&
    (() => {
      const error = medicineQuery.error;
      if (!error || typeof error !== "object") return false;
      const e = error as unknown as Record<string, unknown>;

      return e["status"] === 404 || e["code"] === 404;
    })();

  return (
    <DataTableShell
      description="Detail lengkap master obat. Stok berasal dari batch dan tidak dapat diubah langsung di sini."
      title="Detail Obat"
      toolbar={
        <section className="flex items-center gap-2">
          <ButtonLink
            href={ROUTES.MEDICINES.INDEX}
            leftIcon={<ArrowLeft />}
            variant="secondary"
          >
            Kembali
          </ButtonLink>
          {medicine && (
            <ButtonLink
              href={`${ROUTES.MEDICINES.DETAIL(id)}/edit`}
              leftIcon={<Pencil />}
              variant="primary"
            >
              Edit
            </ButtonLink>
          )}
        </section>
      }
    >
      {medicineQuery.isLoading ? (
        <section className="grid gap-4">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-64" />
        </section>
      ) : isNotFound ? (
        <ErrorState
          actionLabel="Kembali ke Daftar"
          description="Obat yang diminta tidak ditemukan atau telah dihapus."
          onRetry={() => {
            window.location.href = ROUTES.MEDICINES.INDEX;
          }}
          title="Obat Tidak Ditemukan"
        />
      ) : medicineQuery.isError ? (
        <ErrorState
          actionLabel="Coba Lagi"
          description="Data obat gagal dimuat. Periksa koneksi dan coba lagi."
          onRetry={() => medicineQuery.refetch()}
          title="Gagal Memuat Data"
        />
      ) : medicine ? (
        <section className="grid gap-6">
          {/* Header kartu */}
          <Card>
            <CardHeader>
              <section className="flex flex-wrap items-center justify-between gap-4">
                <section className="grid gap-1">
                  <CardTitle>{medicine.name}</CardTitle>
                  <p className="ts-sm font-mono text-text-muted">{medicine.code}</p>
                </section>
                <section className="flex flex-wrap items-center gap-2">
                  <StatusBadge
                    label={MEDICINE_STATUS_LABELS[medicine.status]}
                    tone={MEDICINE_STATUS_TONES[medicine.status]}
                  />
                  <StatusBadge
                    label={`${stockLabel(
                      medicine.totalAvailable,
                      medicine.lowStockThreshold,
                      medicine.criticalStockThreshold,
                    )} — ${formatStockQuantity(
                      medicine.totalAvailable,
                      medicine.unit,
                    )}`}
                    tone={stockTone(
                      medicine.totalAvailable,
                      medicine.lowStockThreshold,
                      medicine.criticalStockThreshold,
                    )}
                  />
                </section>
              </section>
            </CardHeader>
          </Card>

          {/* Informasi master */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Master Obat</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Kode Obat" value={<span className="font-mono">{medicine.code}</span>} />
              <DetailRow label="Nama Obat" value={medicine.name} />
              <DetailRow label="Slug" value={<span className="font-mono text-text-muted">{medicine.slug}</span>} />
              <DetailRow
                label="Kategori"
                value={medicine.category.name ?? <span className="text-text-muted">—</span>}
              />
              <DetailRow label="Satuan" value={medicine.unit} />
              <DetailRow
                label="Harga Jual"
                value={
                  <span className="font-semibold text-text-strong">
                    {formatRp(Number(medicine.sellingPrice))}
                  </span>
                }
              />
              <DetailRow
                label="Wajib Resep"
                value={
                  <Badge tone={medicine.prescriptionRequired ? "warning" : "success"}>
                    {medicine.prescriptionRequired ? "Perlu Resep Dokter" : "Bebas"}
                  </Badge>
                }
              />
              <DetailRow
                label="Status"
                value={
                  <StatusBadge
                    label={MEDICINE_STATUS_LABELS[medicine.status]}
                    tone={MEDICINE_STATUS_TONES[medicine.status]}
                  />
                }
              />
            </CardContent>
          </Card>

          {/* Stok dan ambang batas */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Stok</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Stok Tersedia"
                value={
                  <section className="flex items-center gap-2">
                    <span className="font-semibold text-text-strong">
                      {formatStockQuantity(medicine.totalAvailable, medicine.unit)}
                    </span>
                    <StatusBadge
                      label={stockLabel(
                        medicine.totalAvailable,
                        medicine.lowStockThreshold,
                        medicine.criticalStockThreshold,
                      )}
                      tone={stockTone(
                        medicine.totalAvailable,
                        medicine.lowStockThreshold,
                        medicine.criticalStockThreshold,
                      )}
                    />
                  </section>
                }
              />
              <DetailRow
                label="Stok Dipesan"
                value={formatStockQuantity(medicine.totalReserved, medicine.unit)}
              />
              <DetailRow
                label="Batas Stok Rendah"
                value={formatStockQuantity(medicine.lowStockThreshold, medicine.unit)}
              />
              <DetailRow
                label="Batas Stok Kritis"
                value={formatStockQuantity(medicine.criticalStockThreshold, medicine.unit)}
              />
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow
                label="Dibuat"
                value={formatDateTime(medicine.createdAt)}
              />
              <DetailRow label="ID" value={<span className="font-mono text-text-muted ts-xs">{medicine.id}</span>} />
            </CardContent>
          </Card>
        </section>
      ) : null}
    </DataTableShell>
  );
}
