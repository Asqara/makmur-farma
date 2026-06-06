"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { use, useState } from "react";

import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DataTableShell,
  Dialog,
  ErrorState,
  Skeleton,
  StatusBadge,
  TextInput,
  TextareaInput,
  toast,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type SupplierDetail = {
  address: string | null;
  code: string;
  contactName: string | null;
  createdAt: Date | string;
  email: string | null;
  id: string;
  isActive: boolean;
  name: string;
  phone: string | null;
};

type DetailRowProps = {
  label: string;
  value: React.ReactNode;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <section className="grid grid-cols-[160px_1fr] items-start gap-2 border-b border-border-default py-3 last:border-b-0">
      <span className="ts-sm font-medium text-text-muted">{label}</span>
      <span className="ts-sm text-text-default">{value}</span>
    </section>
  );
}

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Supplier detail page showing contact information, status, and metadata.
 */
export default function SupplierDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const queryClient = useQueryClient();

  const [editOpen, setEditOpen] = useState(false);

  // Edit form state
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  const supplierQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.suppliers({ id }).get();

      if (response.error) throw response.error;

      return response.data as SupplierDetail;
    },
    queryKey: ["suppliers", id],
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

  const supplier = supplierQuery.data;

  const isNotFound =
    supplierQuery.isError &&
    (() => {
      const error = supplierQuery.error;
      if (!error || typeof error !== "object") return false;
      const e = error as unknown as Record<string, unknown>;

      return e["status"] === 404 || e["code"] === 404;
    })();

  const editMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.suppliers({ id }).put({
        name,
        contactName: contactName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        isActive,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal memperbarui supplier. Periksa data dan coba lagi.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers", id] });
      toast.success("Supplier berhasil diperbarui.");
      setEditOpen(false);
    },
  });

  function openEdit() {
    if (!supplier) return;

    setName(supplier.name);
    setContactName(supplier.contactName ?? "");
    setEmail(supplier.email ?? "");
    setPhone(supplier.phone ?? "");
    setAddress(supplier.address ?? "");
    setIsActive(supplier.isActive);
    setEditOpen(true);
  }

  const isSaving = editMutation.isPending;

  return (
    <>
      <DataTableShell
        description="Detail informasi kontak dan status supplier."
        title="Detail Supplier"
        toolbar={
          <section className="flex items-center gap-2">
            <ButtonLink
              href={ROUTES.SUPPLIERS}
              leftIcon={<ArrowLeft />}
              variant="secondary"
            >
              Kembali
            </ButtonLink>
            {supplier && (
              <Button leftIcon={<Pencil />} onClick={openEdit} variant="primary">
                Edit
              </Button>
            )}
          </section>
        }
      >
        {supplierQuery.isLoading ? (
          <section className="grid gap-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-64" />
          </section>
        ) : isNotFound ? (
          <ErrorState
            actionLabel="Kembali ke Daftar"
            description="Supplier yang diminta tidak ditemukan atau telah dihapus."
            onRetry={() => {
              window.location.href = ROUTES.SUPPLIERS;
            }}
            title="Supplier Tidak Ditemukan"
          />
        ) : supplierQuery.isError ? (
          <ErrorState
            actionLabel="Coba Lagi"
            description="Data supplier gagal dimuat. Periksa koneksi dan coba lagi."
            onRetry={() => supplierQuery.refetch()}
            title="Gagal Memuat Data"
          />
        ) : supplier ? (
          <section className="grid gap-6">
            {/* Header */}
            <Card>
              <CardHeader>
                <section className="flex flex-wrap items-center justify-between gap-4">
                  <section className="grid gap-1">
                    <CardTitle>{supplier.name}</CardTitle>
                    <p className="ts-sm font-mono text-text-muted">{supplier.code}</p>
                  </section>
                  <StatusBadge
                    label={supplier.isActive ? "Aktif" : "Nonaktif"}
                    tone={supplier.isActive ? "success" : "neutral"}
                  />
                </section>
              </CardHeader>
            </Card>

            {/* Informasi kontak */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Kontak</CardTitle>
              </CardHeader>
              <CardContent>
                <DetailRow
                  label="Kode Supplier"
                  value={<span className="font-mono">{supplier.code}</span>}
                />
                <DetailRow
                  label="Nama Supplier"
                  value={
                    <span className="font-medium text-text-strong">{supplier.name}</span>
                  }
                />
                <DetailRow
                  label="Nama Kontak"
                  value={
                    supplier.contactName ?? (
                      <span className="text-text-muted">—</span>
                    )
                  }
                />
                <DetailRow
                  label="Email"
                  value={
                    supplier.email ? (
                      <a
                        className="text-primary-blue hover:underline"
                        href={`mailto:${supplier.email}`}
                      >
                        {supplier.email}
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )
                  }
                />
                <DetailRow
                  label="Telepon"
                  value={
                    supplier.phone ? (
                      <a
                        className="text-primary-blue hover:underline"
                        href={`tel:${supplier.phone}`}
                      >
                        {supplier.phone}
                      </a>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )
                  }
                />
                <DetailRow
                  label="Alamat"
                  value={
                    supplier.address ? (
                      <span className="whitespace-pre-line">{supplier.address}</span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )
                  }
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
                  label="Status"
                  value={
                    <StatusBadge
                      label={supplier.isActive ? "Aktif" : "Nonaktif"}
                      tone={supplier.isActive ? "success" : "neutral"}
                    />
                  }
                />
                <DetailRow
                  label="Dibuat"
                  value={formatDateTime(supplier.createdAt)}
                />
                <DetailRow
                  label="ID"
                  value={
                    <span className="ts-xs font-mono text-text-muted">{supplier.id}</span>
                  }
                />
              </CardContent>
            </Card>
          </section>
        ) : null}
      </DataTableShell>

      {/* Edit Dialog */}
      <Dialog
        description="Perbarui informasi kontak atau status supplier."
        footer={
          <>
            <Button
              disabled={isSaving}
              onClick={() => setEditOpen(false)}
              variant="secondary"
            >
              Batal
            </Button>
            <Button
              disabled={isSaving}
              leftIcon={isSaving ? <Loader2 className="animate-spin" /> : undefined}
              onClick={() => editMutation.mutate()}
              variant="primary"
            >
              Perbarui
            </Button>
          </>
        }
        id="supplier-edit-dialog"
        onClose={() => setEditOpen(false)}
        open={editOpen}
        title="Edit Supplier"
      >
        <section className="grid gap-4">
          <TextInput
            id="detail-supplier-name"
            label="Nama Supplier"
            onChange={(e) => setName(e.target.value)}
            placeholder="cth. PT Kimia Farma"
            required
            value={name}
          />
          <TextInput
            id="detail-supplier-contact-name"
            label="Nama Kontak"
            onChange={(e) => setContactName(e.target.value)}
            placeholder="cth. Budi Santoso"
            value={contactName}
          />
          <TextInput
            id="detail-supplier-email"
            label="Email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cth. supplier@kimiafarma.co.id"
            type="email"
            value={email}
          />
          <TextInput
            id="detail-supplier-phone"
            label="Nomor Telepon"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="cth. 021-5551234"
            type="tel"
            value={phone}
          />
          <TextareaInput
            id="detail-supplier-address"
            label="Alamat"
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Alamat lengkap supplier (opsional)"
            rows={3}
            value={address}
          />
          <section className="flex items-center gap-3">
            <input
              checked={isActive}
              id="detail-supplier-is-active"
              onChange={(e) => setIsActive(e.target.checked)}
              type="checkbox"
            />
            <label
              className="ts-sm cursor-pointer text-text-default"
              htmlFor="detail-supplier-is-active"
            >
              Supplier aktif
            </label>
          </section>
        </section>
      </Dialog>
    </>
  );
}
