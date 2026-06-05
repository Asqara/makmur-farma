"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, PowerOff, Power } from "lucide-react";
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
import { eden } from "@/lib/eden";
import { formatDateTime } from "@/utils/inventoryDisplay";

type CategoryRow = {
  code: string;
  createdAt: Date | string;
  description: string | null;
  id: string;
  isActive: boolean;
  name: string;
  slug: string;
};

type CategoryResponse = {
  data: CategoryRow[];
};

type CategoryDialogState =
  | { mode: "create" }
  | {
      mode: "edit";
      id: string;
      name: string;
      description: string | null;
      isActive: boolean;
    }
  | null;

type ToggleDialogState = {
  id: string;
  name: string;
  action: "activate" | "deactivate";
} | null;

export default function CategoriesPage() {
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState<CategoryDialogState>(null);
  const [toggleDialog, setToggleDialog] = useState<ToggleDialogState>(null);

  // Form state for create/edit
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.categories.get({
        query: { limit: "50", page: "1", sortBy: "name", sortDir: "asc" },
      });

      if (response.error) throw response.error;

      return response.data as CategoryResponse;
    },
    queryKey: ["categories"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await eden.api.v1.categories.post({
        code,
        name,
        description: description || undefined,
        isActive: true,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal membuat kategori. Periksa data dan coba lagi.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori berhasil dibuat.");
      setDialog(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await eden.api.v1.categories({ id }).put({
        name,
        description: description || undefined,
        isActive,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal memperbarui kategori. Periksa data dan coba lagi.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Kategori berhasil diperbarui.");
      setDialog(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({
      id,
      activate,
    }: {
      id: string;
      activate: boolean;
    }) => {
      const response = await eden.api.v1.categories({ id }).put({ isActive: activate });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: () => {
      toast.error("Gagal mengubah status kategori.");
    },
    onSuccess: (_, { activate }) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(
        activate ? "Kategori berhasil diaktifkan." : "Kategori berhasil dinonaktifkan.",
      );
      setToggleDialog(null);
    },
  });

  function openCreate() {
    setCode("");
    setName("");
    setDescription("");
    setIsActive(true);
    setDialog({ mode: "create" });
  }

  function openEdit(category: CategoryRow) {
    setName(category.name);
    setDescription(category.description ?? "");
    setIsActive(category.isActive);
    setDialog({
      mode: "edit",
      id: category.id,
      name: category.name,
      description: category.description,
      isActive: category.isActive,
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
  const dialogTitle = isCreate ? "Tambah Kategori" : "Edit Kategori";

  return (
    <>
      <DataTableShell
        description="Kategori membantu filter katalog dan laporan tanpa menduplikasi master obat."
        title="Kategori Obat"
        toolbar={
          <Button leftIcon={<Plus />} onClick={openCreate} size="sm">
            Tambah Kategori
          </Button>
        }
      >
        {query.isError ? (
          <ErrorState
            description="Kategori gagal dimuat."
            onRetry={() => query.refetch()}
            title="Kategori Tidak Tersedia"
          />
        ) : query.data?.data.length ? (
          <Card>
            <CardContent>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dibuat</TableHead>
                    <TableHead>
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-mono">{category.code}</TableCell>
                      <TableCell className="font-medium text-text-strong">
                        {category.name}
                      </TableCell>
                      <TableCell>{category.slug}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={category.isActive ? "Aktif" : "Nonaktif"}
                          tone={category.isActive ? "success" : "neutral"}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(category.createdAt)}</TableCell>
                      <TableCell>
                        <ActionMenu
                          label={`Aksi untuk ${category.name}`}
                          items={[
                            {
                              icon: <Pencil />,
                              label: "Edit",
                              onSelect: () => openEdit(category),
                            },
                            ...(category.isActive
                              ? [
                                  {
                                    icon: <PowerOff />,
                                    label: "Nonaktifkan",
                                    onSelect: () =>
                                      setToggleDialog({
                                        id: category.id,
                                        name: category.name,
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
                                        id: category.id,
                                        name: category.name,
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
            description={query.isLoading ? "Memuat kategori..." : "Belum ada kategori."}
            title={query.isLoading ? "Memuat" : "Kategori Kosong"}
          />
        )}
      </DataTableShell>

      {/* Create / Edit Dialog */}
      <Dialog
        description={
          isCreate
            ? "Isi detail kategori baru. Kode tidak dapat diubah setelah disimpan."
            : "Perbarui nama, deskripsi, atau status kategori."
        }
        footer={
          <>
            <Button
              disabled={isSaving}
              onClick={() => setDialog(null)}
              variant="secondary"
            >
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
        id="category-dialog"
        onClose={() => setDialog(null)}
        open={dialog !== null}
        title={dialogTitle}
      >
        <section className="grid gap-4">
          {isCreate && (
            <TextInput
              id="category-code"
              label="Kode"
              onChange={(e) => setCode(e.target.value)}
              placeholder="cth. KAT-001"
              required
              value={code}
            />
          )}
          <TextInput
            id="category-name"
            label="Nama Kategori"
            onChange={(e) => setName(e.target.value)}
            placeholder="cth. Antibiotik"
            required
            value={name}
          />
          <TextareaInput
            id="category-description"
            label="Deskripsi"
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi singkat kategori (opsional)"
            rows={3}
            value={description}
          />
          {!isCreate && (
            <section className="flex items-center gap-3">
              <input
                checked={isActive}
                id="category-is-active"
                onChange={(e) => setIsActive(e.target.checked)}
                type="checkbox"
              />
              <label
                className="ts-sm cursor-pointer text-text-default"
                htmlFor="category-is-active"
              >
                Kategori aktif
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
            ? `Kategori "${toggleDialog?.name}" akan diaktifkan kembali dan dapat digunakan pada obat.`
            : `Kategori "${toggleDialog?.name}" akan dinonaktifkan. Obat yang sudah menggunakan kategori ini tidak terpengaruh.`
        }
        id="category-toggle-dialog"
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
          toggleDialog?.action === "activate"
            ? "Aktifkan Kategori"
            : "Nonaktifkan Kategori"
        }
        variant={toggleDialog?.action === "activate" ? "info" : "warning"}
      />
    </>
  );
}
