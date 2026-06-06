"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Loader2, Pencil, Plus, Power, PowerOff } from "lucide-react";
import { useState } from "react";

import {
  ActionMenu,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  DataTable,
  DataTableShell,
  Dialog,
  EmptyState,
  ErrorState,
  StatusBadge,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
  TextareaInput,
  toast,
} from "@/components/ui";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";

type SupplierRow = {
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

type SupplierResponse = {
  data: SupplierRow[];
};

type SupplierDialogState =
  | { mode: "create" }
  | {
      mode: "edit";
      id: string;
      name: string;
      contactName: string | null;
      email: string | null;
      phone: string | null;
      address: string | null;
      isActive: boolean;
    }
  | null;

type ToggleDialogState = {
  id: string;
  name: string;
  action: "activate" | "deactivate";
} | null;

export default function SuppliersPage() {
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState<SupplierDialogState>(null);
  const [toggleDialog, setToggleDialog] = useState<ToggleDialogState>(null);

  // Form state
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isActive, setIsActive] = useState(true);

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.suppliers.get({
        query: { limit: "100", page: "1", sortBy: "name", sortDir: "asc" },
      });

      if (response.error) throw response.error;

      return response.data as SupplierResponse;
    },
    queryKey: ["suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.suppliers.post({
        code,
        name,
        contactName: contactName || undefined,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        isActive: true,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal menambah supplier. Periksa data dan coba lagi.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier berhasil ditambahkan.");
      setDialog(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (id: string) => {
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
      toast.success("Supplier berhasil diperbarui.");
      setDialog(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: string; activate: boolean }) => {
      const response = await eden.api.v1.suppliers({ id }).put({ isActive: activate });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal mengubah status supplier.");
    },
    onSuccess: (_, { activate }) => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(
        activate ? "Supplier berhasil diaktifkan." : "Supplier berhasil dinonaktifkan.",
      );
      setToggleDialog(null);
    },
  });

  function openCreate() {
    setCode("");
    setName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setIsActive(true);
    setDialog({ mode: "create" });
  }

  function openEdit(supplier: SupplierRow) {
    setName(supplier.name);
    setContactName(supplier.contactName ?? "");
    setEmail(supplier.email ?? "");
    setPhone(supplier.phone ?? "");
    setAddress(supplier.address ?? "");
    setIsActive(supplier.isActive);
    setDialog({
      mode: "edit",
      id: supplier.id,
      name: supplier.name,
      contactName: supplier.contactName,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      isActive: supplier.isActive,
    });
  }

  function handleFormSubmit() {
    if (!dialog) return;

    if (dialog.mode === "create") {
      createMutation.mutate();
    } else {
      editMutation.mutate(dialog.id);
    }
  }

  const isSaving = createMutation.isPending || editMutation.isPending;
  const isCreate = dialog?.mode === "create";
  const dialogTitle = isCreate ? "Tambah Supplier" : "Edit Supplier";

  return (
    <>
      <DataTableShell
        description="Supplier digunakan pada batch penerimaan stok dan audit riwayat pengadaan."
        title="Supplier"
        toolbar={
          <Button leftIcon={<Plus />} onClick={openCreate} size="sm">
            Tambah Supplier
          </Button>
        }
      >
        {query.isError ? (
          <ErrorState
            description="Daftar supplier gagal dimuat."
            onRetry={() => query.refetch()}
            title="Supplier Tidak Tersedia"
          />
        ) : query.data?.data.length ? (
          <Card>
            <CardContent>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell className="font-mono">{supplier.code}</TableCell>
                      <TableCell className="font-medium text-text-strong">
                        {supplier.name}
                      </TableCell>
                      <TableCell>{supplier.contactName ?? "-"}</TableCell>
                      <TableCell>{supplier.email ?? "-"}</TableCell>
                      <TableCell>{supplier.phone ?? "-"}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={supplier.isActive ? "Aktif" : "Nonaktif"}
                          tone={supplier.isActive ? "success" : "neutral"}
                        />
                      </TableCell>
                      <TableCell>
                        <ActionMenu
                          label={`Aksi untuk ${supplier.name}`}
                          items={[
                            {
                              href: `${ROUTES.SUPPLIERS}/${supplier.id}`,
                              icon: <Eye />,
                              label: "Lihat Detail",
                            },
                            {
                              icon: <Pencil />,
                              label: "Edit",
                              onSelect: () => openEdit(supplier),
                            },
                            ...(supplier.isActive
                              ? [
                                  {
                                    icon: <PowerOff />,
                                    label: "Nonaktifkan",
                                    onSelect: () =>
                                      setToggleDialog({
                                        id: supplier.id,
                                        name: supplier.name,
                                        action: "deactivate",
                                      }),
                                  },
                                ]
                              : [
                                  {
                                    icon: <Power />,
                                    label: "Aktifkan",
                                    onSelect: () =>
                                      setToggleDialog({
                                        id: supplier.id,
                                        name: supplier.name,
                                        action: "activate",
                                      }),
                                  },
                                ]),
                          ]}
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
            description={query.isLoading ? "Memuat supplier..." : "Belum ada supplier terdaftar."}
            title={query.isLoading ? "Memuat" : "Supplier Kosong"}
          />
        )}
      </DataTableShell>

      {/* Create / Edit Dialog */}
      <Dialog
        description={
          isCreate
            ? "Isi detail supplier baru. Kode tidak dapat diubah setelah disimpan."
            : "Perbarui informasi kontak atau status supplier."
        }
        footer={
          <>
            <Button disabled={isSaving} onClick={() => setDialog(null)} variant="secondary">
              Batal
            </Button>
            <Button
              disabled={isSaving}
              leftIcon={isSaving ? <Loader2 className="animate-spin" /> : undefined}
              onClick={handleFormSubmit}
              variant="primary"
            >
              {isCreate ? "Simpan" : "Perbarui"}
            </Button>
          </>
        }
        id="supplier-dialog"
        onClose={() => setDialog(null)}
        open={dialog !== null}
        title={dialogTitle}
      >
        <section className="grid gap-4">
          {isCreate && (
            <TextInput
              id="supplier-code"
              label="Kode"
              onChange={(e) => setCode(e.target.value)}
              placeholder="cth. SUP-001"
              required
              value={code}
            />
          )}
          <TextInput
            id="supplier-name"
            label="Nama Supplier"
            onChange={(e) => setName(e.target.value)}
            placeholder="cth. PT Kimia Farma"
            required
            value={name}
          />
          <TextInput
            id="supplier-contact-name"
            label="Nama Kontak"
            onChange={(e) => setContactName(e.target.value)}
            placeholder="cth. Budi Santoso"
            value={contactName}
          />
          <TextInput
            id="supplier-email"
            label="Email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="cth. supplier@kimiafarma.co.id"
            type="email"
            value={email}
          />
          <TextInput
            id="supplier-phone"
            label="Nomor Telepon"
            onChange={(e) => setPhone(e.target.value)}
            placeholder="cth. 021-5551234"
            type="tel"
            value={phone}
          />
          <TextareaInput
            id="supplier-address"
            label="Alamat"
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Alamat lengkap supplier (opsional)"
            rows={3}
            value={address}
          />
          {!isCreate && (
            <section className="flex items-center gap-3">
              <input
                checked={isActive}
                id="supplier-is-active"
                onChange={(e) => setIsActive(e.target.checked)}
                type="checkbox"
              />
              <label
                className="ts-sm cursor-pointer text-text-default"
                htmlFor="supplier-is-active"
              >
                Supplier aktif
              </label>
            </section>
          )}
        </section>
      </Dialog>

      {/* Toggle Active / Inactive Confirm Dialog */}
      <ConfirmDialog
        confirmLabel={toggleDialog?.action === "activate" ? "Aktifkan" : "Nonaktifkan"}
        description={
          toggleDialog?.action === "activate"
            ? `Supplier "${toggleDialog?.name}" akan diaktifkan kembali dan dapat digunakan pada penerimaan batch.`
            : `Supplier "${toggleDialog?.name}" akan dinonaktifkan. Batch yang sudah menggunakan supplier ini tidak terpengaruh.`
        }
        id="supplier-toggle-dialog"
        loading={toggleMutation.isPending}
        onCancel={() => setToggleDialog(null)}
        onConfirm={() => {
          if (!toggleDialog) return;
          toggleMutation.mutate({
            id: toggleDialog.id,
            activate: toggleDialog.action === "activate",
          });
        }}
        open={toggleDialog !== null}
        title={
          toggleDialog?.action === "activate" ? "Aktifkan Supplier" : "Nonaktifkan Supplier"
        }
        variant={toggleDialog?.action === "activate" ? "info" : "warning"}
      />
    </>
  );
}
