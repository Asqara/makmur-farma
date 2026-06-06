"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, PowerOff, Search } from "lucide-react";
import { useState } from "react";

import {
  ActionMenu,
  Badge,
  ButtonLink,
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  DataTableShell,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
  toast,
} from "@/components/ui";
import {
  MEDICINE_STATUS_LABELS,
  MEDICINE_STATUS_TONES,
  type MedicineStatus,
} from "@/constants/domain";
import { ROUTES } from "@/constants/routes";
import { useDebounce } from "@/hooks/useDebounce";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatStockQuantity } from "@/utils/inventoryDisplay";

type MedicineListItem = {
  category: {
    name: string | null;
  };
  code: string;
  criticalStockThreshold: number;
  id: string;
  lowStockThreshold: number;
  name: string;
  prescriptionRequired: boolean;
  sellingPrice: string;
  status: MedicineStatus;
  totalAvailable: number;
  totalReserved: number;
  unit: string;
};

type MedicineListResponse = {
  data: MedicineListItem[];
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

/**
 * Operational medicine list with ActionMenu for each row.
 */
export default function MedicinesPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search.trim(), 300);
  const [deactivateTarget, setDeactivateTarget] = useState<MedicineListItem | null>(null);
  const queryClient = useQueryClient();

  const medicinesQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.medicines.get({
        query: {
          limit: "20",
          page: "1",
          search: debouncedSearch,
          sortBy: "name",
          sortDir: "asc",
        },
      });

      if (response.error) throw response.error;

      return response.data as MedicineListResponse;
    },
    queryKey: ["medicines", debouncedSearch],
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await eden.api.v1.medicines({ id }).delete();

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal menonaktifkan obat. Coba lagi.");
    },
    onSuccess: () => {
      toast.success("Obat berhasil dinonaktifkan.");
      setDeactivateTarget(null);
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
    },
  });

  return (
    <>
      <DataTableShell
        description="Kelola master obat tanpa mengubah stok langsung. Stok berasal dari batch dan pergerakan stok."
        title="Obat"
        toolbar={
          <section className="grid gap-3 md:grid-cols-[minmax(0,320px)_auto_auto] md:items-end">
            <TextInput
              id="medicine-search"
              label="Cari Obat"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama atau kode obat"
              value={search}
            />
            <section className="flex min-h-10 items-center gap-2 text-text-muted">
              <Search aria-hidden="true" className="size-4" />
              <span className="ts-sm"></span>
            </section>
            <section className="flex min-h-10 items-end">
              <ButtonLink
                href={`${ROUTES.MEDICINES.INDEX}/new`}
                leftIcon={<Plus />}
                variant="primary"
              >
                Tambah Obat
              </ButtonLink>
            </section>
          </section>
        }
      >
        {medicinesQuery.isLoading ? (
          <section className="grid gap-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-64" />
          </section>
        ) : medicinesQuery.isError ? (
          <ErrorState
            actionLabel="Coba Lagi"
            description="Daftar obat gagal dimuat."
            onRetry={() => medicinesQuery.refetch()}
            title="Obat Tidak Tersedia"
          />
        ) : medicinesQuery.data?.data.length ? (
          <Card>
            <CardContent>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama Obat</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Resep</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medicinesQuery.data.data.map((medicine) => (
                    <TableRow key={medicine.id}>
                      <TableCell className="font-mono">{medicine.code}</TableCell>
                      <TableCell className="font-medium text-text-strong">
                        {medicine.name}
                      </TableCell>
                      <TableCell>{medicine.category.name ?? "-"}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={`${stockLabel(
                            medicine.totalAvailable,
                            medicine.lowStockThreshold,
                            medicine.criticalStockThreshold,
                          )} - ${formatStockQuantity(
                            medicine.totalAvailable,
                            medicine.unit,
                          )}`}
                          tone={stockTone(
                            medicine.totalAvailable,
                            medicine.lowStockThreshold,
                            medicine.criticalStockThreshold,
                          )}
                        />
                      </TableCell>
                      <TableCell>{formatRp(Number(medicine.sellingPrice))}</TableCell>
                      <TableCell>
                        <Badge
                          tone={medicine.prescriptionRequired ? "warning" : "success"}
                        >
                          {medicine.prescriptionRequired ? "Perlu Resep" : "Bebas"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          label={MEDICINE_STATUS_LABELS[medicine.status]}
                          tone={MEDICINE_STATUS_TONES[medicine.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <ActionMenu
                          items={[
                            {
                              href: ROUTES.MEDICINES.DETAIL(medicine.id),
                              icon: <Eye />,
                              label: "Lihat Detail",
                            },
                            {
                              href: `${ROUTES.MEDICINES.DETAIL(medicine.id)}/edit`,
                              icon: <Pencil />,
                              label: "Edit",
                            },
                            ...(medicine.status === "ACTIVE"
                              ? [
                                  {
                                    icon: <PowerOff />,
                                    label: "Nonaktifkan",
                                    onSelect: () => setDeactivateTarget(medicine),
                                  },
                                ]
                              : []),
                          ]}
                          label={`Aksi untuk ${medicine.name}`}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            description="Belum ada obat yang cocok dengan filter saat ini."
            title="Obat Kosong"
          />
        )}
      </DataTableShell>

      <ConfirmDialog
        confirmLabel={deactivateMutation.isPending ? "Menonaktifkan..." : "Nonaktifkan"}
        description={`Obat "${deactivateTarget?.name ?? ""}" akan dinonaktifkan. Histori transaksi dan stok tetap tersimpan. Lanjutkan?`}
        id="deactivate-medicine-dialog"
        loading={deactivateMutation.isPending}
        onCancel={() => setDeactivateTarget(null)}
        onConfirm={() => {
          if (deactivateTarget) {
            deactivateMutation.mutate(deactivateTarget.id);
          }
        }}
        open={deactivateTarget !== null}
        title="Nonaktifkan Obat"
        variant="warning"
      />
    </>
  );
}
