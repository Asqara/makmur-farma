"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Eye, History, Loader2, Package, Plus, SlidersHorizontal } from "lucide-react";

import {
  ActionMenu,
  Button,
  ButtonLink,
  Card,
  CardContent,
  DataTable,
  DataTableShell,
  DateInput,
  Dialog,
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
  TextInput,
  TextareaInput,
  toast,
} from "@/components/ui";
import {
  BATCH_STATUS_LABELS,
  BATCH_STATUS_TONES,
  type BatchStatus,
} from "@/constants/domain";
import { eden } from "@/lib/eden";
import { ROUTES } from "@/constants/routes";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime, formatStockQuantity } from "@/utils/inventoryDisplay";

type BatchResponse = {
  data: Array<{
    availableQuantity: number;
    batchNumber: string;
    expiryDate: Date | string;
    id: string;
    medicine: {
      code: string;
      id: string;
      name: string;
      unit: string;
    };
    purchaseCost: string;
    receivedDate: Date | string;
    reservedQuantity: number;
    status: BatchStatus;
    supplier: {
      id: string | null;
      name: string | null;
    };
  }>;
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
};
const PAGE_SIZE = 30;

type MedicineOption = { id: string; name: string; code: string };
type SupplierOption = { id: string; name: string };

type ReceiptForm = {
  batchNumber: string;
  expiryDate: string;
  medicineId: string;
  purchaseCost: string;
  quantity: string;
  receivedDate: string;
  supplierId: string;
};

type AdjustForm = {
  adjustmentType: string;
  quantity: string;
  reason: string;
};

const EMPTY_RECEIPT: ReceiptForm = {
  batchNumber: "",
  expiryDate: "",
  medicineId: "",
  purchaseCost: "",
  quantity: "",
  receivedDate: "",
  supplierId: "",
};

const EMPTY_ADJUST: AdjustForm = {
  adjustmentType: "",
  quantity: "",
  reason: "",
};

export default function BatchesPage() {
  const queryClient = useQueryClient();

  const [receiptOpen, setReceiptOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [receiptForm, setReceiptForm] = useState<ReceiptForm>(EMPTY_RECEIPT);
  const [receiptErrors, setReceiptErrors] = useState<Partial<ReceiptForm>>({});

  const [adjustTarget, setAdjustTarget] = useState<string | null>(null);
  const [adjustForm, setAdjustForm] = useState<AdjustForm>(EMPTY_ADJUST);
  const [adjustErrors, setAdjustErrors] = useState<Partial<AdjustForm>>({});

  const query = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.batches.get({
        query: {
          limit: String(PAGE_SIZE),
          page: String(page),
          sortBy: "expiryDate",
          sortDir: "asc",
        },
      });

      if (response.error) throw response.error;

      return response.data as BatchResponse;
    },
    queryKey: ["batches", page],
  });

  const medicinesQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.medicines.get({
        query: { limit: "200", page: "1", sortBy: "name", sortDir: "asc" },
      });

      if (response.error) return { data: [] as MedicineOption[] };

      const raw = response.data as { data: MedicineOption[] };

      return raw;
    },
    queryKey: ["medicines-select"],
  });

  const suppliersQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.suppliers.get({
        query: { limit: "200", page: "1", sortBy: "name", sortDir: "asc" },
      });

      if (response.error) return { data: [] as SupplierOption[] };

      const raw = response.data as { data: SupplierOption[] };

      return raw;
    },
    queryKey: ["suppliers-select"],
  });

  const medicineOptions = (medicinesQuery.data?.data ?? []).map((m) => ({
    label: `${m.name} (${m.code})`,
    value: m.id,
  }));

  const supplierOptions = [
    { label: "— Tanpa Supplier —", value: "" },
    ...(suppliersQuery.data?.data ?? []).map((s) => ({
      label: s.name,
      value: s.id,
    })),
  ];

  const receiptMutation = useMutation({
    mutationFn: async (form: ReceiptForm) => {
      const response = await eden.api.v1.batches.post({
        batchNumber: form.batchNumber,
        expiryDate: form.expiryDate,
        medicineId: form.medicineId,
        purchaseCost: form.purchaseCost,
        quantity: Number(form.quantity),
        receivedDate: form.receivedDate,
        supplierId: form.supplierId || null,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "publicMessage" in err
          ? String((err as { publicMessage: string }).publicMessage)
          : "Gagal menyimpan penerimaan stok.";

      toast.error(message);
    },
    onSuccess: () => {
      toast.success("Stok berhasil diterima.");
      setReceiptOpen(false);
      setReceiptForm(EMPTY_RECEIPT);
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  const adjustMutation = useMutation({
    mutationFn: async ({ batchId, form }: { batchId: string; form: AdjustForm }) => {
      const response = await eden.api.v1.batches({ id: batchId }).adjust.post({
        adjustmentType: form.adjustmentType as "ADJUSTMENT_IN" | "ADJUSTMENT_OUT",
        batchId,
        quantity: Number(form.quantity),
        reason: form.reason,
      });

      if (response.error) throw response.error;

      return response.data;
    },
    onError: (err: unknown) => {
      const message =
        err && typeof err === "object" && "publicMessage" in err
          ? String((err as { publicMessage: string }).publicMessage)
          : "Gagal menyesuaikan stok.";

      toast.error(message);
    },
    onSuccess: () => {
      toast.success("Stok berhasil disesuaikan.");
      setAdjustTarget(null);
      setAdjustForm(EMPTY_ADJUST);
      queryClient.invalidateQueries({ queryKey: ["batches"] });
    },
  });

  function validateReceipt() {
    const errors: Partial<ReceiptForm> = {};

    if (!receiptForm.medicineId) errors.medicineId = "Pilih obat.";
    if (!receiptForm.batchNumber.trim()) errors.batchNumber = "Nomor batch wajib diisi.";
    if (!receiptForm.receivedDate) errors.receivedDate = "Tanggal terima wajib diisi.";
    if (!receiptForm.expiryDate) errors.expiryDate = "Tanggal kedaluwarsa wajib diisi.";
    if (receiptForm.receivedDate && receiptForm.expiryDate && receiptForm.expiryDate <= receiptForm.receivedDate) {
      errors.expiryDate = "Tanggal kedaluwarsa harus setelah tanggal terima.";
    }
    if (!receiptForm.purchaseCost || Number(receiptForm.purchaseCost) < 0) {
      errors.purchaseCost = "Harga beli wajib diisi.";
    }
    if (!receiptForm.quantity || Number(receiptForm.quantity) < 1) {
      errors.quantity = "Jumlah minimal 1.";
    }

    setReceiptErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function validateAdjust() {
    const errors: Partial<AdjustForm> = {};

    if (!adjustForm.adjustmentType) errors.adjustmentType = "Pilih tipe penyesuaian.";
    if (!adjustForm.quantity || Number(adjustForm.quantity) < 1) {
      errors.quantity = "Jumlah minimal 1.";
    }
    if (!adjustForm.reason.trim() || adjustForm.reason.trim().length < 3) {
      errors.reason = "Alasan minimal 3 karakter.";
    }

    setAdjustErrors(errors);

    return Object.keys(errors).length === 0;
  }

  function handleReceiptSubmit() {
    if (!validateReceipt()) return;
    receiptMutation.mutate(receiptForm);
  }

  function handleAdjustSubmit() {
    if (!adjustTarget) return;
    if (!validateAdjust()) return;
    adjustMutation.mutate({ batchId: adjustTarget, form: adjustForm });
  }

  return (
    <>
      <DataTableShell
        description="Stok operasional berasal dari batch dengan tanggal terima dan kedaluwarsa."
        footer={
          query.data?.pagination ? (
            <section className="flex flex-wrap items-center justify-between gap-3">
              <p className="ts-sm text-text-muted">
                {query.data.pagination.total} batch ditemukan
              </p>
              <Pagination
                currentPage={page}
                onPageChange={setPage}
                pageCount={Math.max(query.data.pagination.totalPages, 1)}
              />
            </section>
          ) : null
        }
        title="Batch dan Stok"
        toolbar={
          <section className="flex items-end justify-end gap-2">
            <ButtonLink
              href={ROUTES.EXPIRY}
              leftIcon={<History />}
              variant="secondary"
            >
              Monitor Kedaluwarsa
            </ButtonLink>
            <Button
              leftIcon={<Plus />}
              onClick={() => {
                setReceiptForm(EMPTY_RECEIPT);
                setReceiptErrors({});
                setReceiptOpen(true);
              }}
              variant="primary"
            >
              Terima Stok
            </Button>
          </section>
        }
      >
        {query.isError ? (
          <ErrorState
            description="Batch gagal dimuat."
            onRetry={() => query.refetch()}
            title="Batch Tidak Tersedia"
          />
        ) : query.data?.data.length ? (
          <Card>
            <CardContent>
              <DataTable>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch</TableHead>
                    <TableHead>Obat</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Tersedia</TableHead>
                    <TableHead>Reserved</TableHead>
                    <TableHead>Kedaluwarsa</TableHead>
                    <TableHead>Harga Beli</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {query.data.data.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono">{batch.batchNumber}</TableCell>
                      <TableCell>
                        <p className="font-medium text-text-strong">
                          {batch.medicine.name}
                        </p>
                        <p className="ts-xs text-text-muted">
                          {batch.medicine.code}
                        </p>
                      </TableCell>
                      <TableCell>{batch.supplier.name ?? "-"}</TableCell>
                      <TableCell>
                        {formatStockQuantity(
                          batch.availableQuantity,
                          batch.medicine.unit,
                        )}
                      </TableCell>
                      <TableCell>
                        {formatStockQuantity(
                          batch.reservedQuantity,
                          batch.medicine.unit,
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(batch.expiryDate)}</TableCell>
                      <TableCell>{formatRp(Number(batch.purchaseCost))}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={BATCH_STATUS_LABELS[batch.status]}
                          tone={BATCH_STATUS_TONES[batch.status]}
                        />
                      </TableCell>
                      <TableCell>
                        <ActionMenu
                          items={[
                            {
                              href: `/batches/${batch.id}`,
                              icon: <Eye className="size-4" />,
                              label: "Lihat Detail",
                            },
                            {
                              icon: <SlidersHorizontal className="size-4" />,
                              label: "Sesuaikan Stok",
                              onSelect: () => {
                                setAdjustTarget(batch.id);
                                setAdjustForm(EMPTY_ADJUST);
                                setAdjustErrors({});
                              },
                            },
                          ]}
                          label={`Aksi batch ${batch.batchNumber}`}
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
            description={query.isLoading ? "Memuat batch..." : "Belum ada batch stok."}
            title={query.isLoading ? "Memuat" : "Batch Kosong"}
          />
        )}
      </DataTableShell>

      {/* Stock Receipt Dialog */}
      <Dialog
        footer={
          <section className="flex justify-end gap-3">
            <Button
              disabled={receiptMutation.isPending}
              onClick={() => setReceiptOpen(false)}
              variant="secondary"
            >
              Batal
            </Button>
            <Button
              disabled={receiptMutation.isPending}
              leftIcon={
                receiptMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Package />
                )
              }
              onClick={handleReceiptSubmit}
              variant="primary"
            >
              Simpan Penerimaan
            </Button>
          </section>
        }
        id="stock-receipt-dialog"
        onClose={() => setReceiptOpen(false)}
        open={receiptOpen}
        title="Terima Stok Baru"
        description="Catat penerimaan batch stok dari supplier."
      >
        <section className="grid gap-4">
          <SelectInput
            errorMessage={receiptErrors.medicineId}
            id="receipt-medicine"
            label="Obat"
            onValueChange={(v) =>
              setReceiptForm((prev) => ({ ...prev, medicineId: v }))
            }
            options={medicineOptions}
            placeholder="Pilih obat"
            required
            searchable
            value={receiptForm.medicineId}
          />
          <SelectInput
            id="receipt-supplier"
            label="Supplier"
            onValueChange={(v) =>
              setReceiptForm((prev) => ({ ...prev, supplierId: v }))
            }
            options={supplierOptions}
            placeholder="— Tanpa Supplier —"
            searchable
            value={receiptForm.supplierId}
          />
          <TextInput
            errorMessage={receiptErrors.batchNumber}
            id="receipt-batch-number"
            label="Nomor Batch"
            onChange={(e) =>
              setReceiptForm((prev) => ({ ...prev, batchNumber: e.target.value }))
            }
            placeholder="cth: BTH-2024-001"
            required
            value={receiptForm.batchNumber}
          />
          <section className="grid gap-4 md:grid-cols-2">
            <DateInput
              errorMessage={receiptErrors.receivedDate}
              id="receipt-received-date"
              label="Tanggal Terima"
              onValueChange={(v) =>
                setReceiptForm((prev) => ({ ...prev, receivedDate: v as string }))
              }
              required
              value={receiptForm.receivedDate}
            />
            <DateInput
              errorMessage={receiptErrors.expiryDate}
              id="receipt-expiry-date"
              label="Tanggal Kedaluwarsa"
              onValueChange={(v) =>
                setReceiptForm((prev) => ({ ...prev, expiryDate: v as string }))
              }
              required
              value={receiptForm.expiryDate}
            />
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <TextInput
              errorMessage={receiptErrors.purchaseCost}
              id="receipt-purchase-cost"
              label="Harga Beli (Rp)"
              min="0"
              onChange={(e) =>
                setReceiptForm((prev) => ({ ...prev, purchaseCost: e.target.value }))
              }
              placeholder="cth: 15000"
              required
              type="number"
              value={receiptForm.purchaseCost}
            />
            <TextInput
              errorMessage={receiptErrors.quantity}
              id="receipt-quantity"
              label="Jumlah"
              min="1"
              onChange={(e) =>
                setReceiptForm((prev) => ({ ...prev, quantity: e.target.value }))
              }
              placeholder="cth: 100"
              required
              step="1"
              type="number"
              value={receiptForm.quantity}
            />
          </section>
        </section>
      </Dialog>

      {/* Stock Adjustment Dialog */}
      <Dialog
        footer={
          <section className="flex justify-end gap-3">
            <Button
              disabled={adjustMutation.isPending}
              onClick={() => setAdjustTarget(null)}
              variant="secondary"
            >
              Batal
            </Button>
            <Button
              disabled={adjustMutation.isPending}
              leftIcon={
                adjustMutation.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <SlidersHorizontal />
                )
              }
              onClick={handleAdjustSubmit}
              variant="primary"
            >
              Sesuaikan
            </Button>
          </section>
        }
        id="stock-adjust-dialog"
        onClose={() => setAdjustTarget(null)}
        open={adjustTarget !== null}
        title="Sesuaikan Stok Batch"
        description="Tambah atau kurangi stok batch secara manual."
      >
        <section className="grid gap-4">
          <SelectInput
            errorMessage={adjustErrors.adjustmentType}
            id="adjust-type"
            label="Tipe Penyesuaian"
            onValueChange={(v) =>
              setAdjustForm((prev) => ({ ...prev, adjustmentType: v }))
            }
            options={[
              { label: "Tambah Stok", value: "ADJUSTMENT_IN" },
              { label: "Kurangi Stok", value: "ADJUSTMENT_OUT" },
            ]}
            placeholder="Pilih tipe"
            required
            value={adjustForm.adjustmentType}
          />
          <TextInput
            errorMessage={adjustErrors.quantity}
            id="adjust-quantity"
            label="Jumlah"
            min="1"
            onChange={(e) =>
              setAdjustForm((prev) => ({ ...prev, quantity: e.target.value }))
            }
            placeholder="cth: 10"
            required
            step="1"
            type="number"
            value={adjustForm.quantity}
          />
          <TextareaInput
            errorMessage={adjustErrors.reason}
            id="adjust-reason"
            label="Alasan Penyesuaian"
            onChange={(e) =>
              setAdjustForm((prev) => ({ ...prev, reason: e.target.value }))
            }
            placeholder="Jelaskan alasan penyesuaian stok"
            required
            rows={3}
            value={adjustForm.reason}
          />
        </section>
      </Dialog>
    </>
  );
}
