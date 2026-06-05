"use client";

import { useForm } from "@tanstack/react-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  Button,
  ButtonLink,
  Card,
  CardContent,
  DataTableShell,
  SelectInput,
  TextInput,
  TextareaInput,
  toast,
} from "@/components/ui";
import {
  MEDICINE_STATUS_LABELS,
  MEDICINE_STATUS_VALUES,
} from "@/constants/domain";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";

type CategoryOption = {
  id: string;
  name: string;
};

type CategoryResponse = {
  data: CategoryOption[];
};

const STATUS_OPTIONS = MEDICINE_STATUS_VALUES.map((value) => ({
  label: MEDICINE_STATUS_LABELS[value],
  value,
}));

/**
 * Form page to create a new medicine master record.
 */
export default function NewMedicinePage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const categoriesQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.categories.get({
        query: { limit: "100", page: "1", sortBy: "name", sortDir: "asc" },
      });

      if (response.error) throw response.error;

      return response.data as CategoryResponse;
    },
    queryKey: ["categories"],
  });

  const categoryOptions = (categoriesQuery.data?.data ?? []).map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));

  const form = useForm({
    defaultValues: {
      categoryId: "" as string,
      code: "",
      criticalStockThreshold: "3",
      description: "",
      lowStockThreshold: "10",
      name: "",
      prescriptionRequired: false,
      sellingPrice: "",
      status: "ACTIVE" as string,
      unit: "unit",
    },
    onSubmit: async ({ value }) => {
      const body = {
        categoryId: value.categoryId || null,
        code: value.code,
        criticalStockThreshold: Number(value.criticalStockThreshold) || 3,
        description: value.description || undefined,
        lowStockThreshold: Number(value.lowStockThreshold) || 10,
        name: value.name,
        prescriptionRequired: value.prescriptionRequired,
        sellingPrice: value.sellingPrice,
        status: value.status as
          | "ACTIVE"
          | "INACTIVE"
          | "DISCONTINUED"
          | "BLOCKED",
        unit: value.unit || "unit",
      };

      const response = await eden.api.v1.medicines.post(body);

      if (response.error) {
        const message =
          typeof response.error === "object" &&
          response.error !== null &&
          "message" in response.error
            ? String((response.error as { message?: string }).message)
            : "Gagal menyimpan obat. Coba lagi.";

        toast.error(message);
        return;
      }

      toast.success("Obat berhasil ditambahkan.");
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      router.push(ROUTES.MEDICINES.INDEX);
    },
  });

  return (
    <DataTableShell
      description="Isi data master obat. Stok dikelola melalui batch dan pergerakan stok terpisah."
      title="Tambah Obat Baru"
      toolbar={
        <ButtonLink
          href={ROUTES.MEDICINES.INDEX}
          leftIcon={<ArrowLeft />}
          variant="secondary"
        >
          Kembali
        </ButtonLink>
      }
    >
      <Card>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <section className="grid gap-6">
              {/* Identitas obat */}
              <section className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="code"
                  validators={{
                    onChange: ({ value }) =>
                      !value.trim() ? "Kode obat wajib diisi." : undefined,
                  }}
                >
                  {(field) => (
                    <TextInput
                      errorMessage={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : undefined
                      }
                      id="medicine-code"
                      label="Kode Obat"
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Contoh: OBT-001"
                      required
                      value={field.state.value}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) =>
                      !value.trim()
                        ? "Nama obat wajib diisi."
                        : value.trim().length < 2
                          ? "Nama obat minimal 2 karakter."
                          : undefined,
                  }}
                >
                  {(field) => (
                    <TextInput
                      errorMessage={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : undefined
                      }
                      id="medicine-name"
                      label="Nama Obat"
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Contoh: Paracetamol 500mg"
                      required
                      value={field.state.value}
                    />
                  )}
                </form.Field>
              </section>

              {/* Kategori dan satuan */}
              <section className="grid gap-4 sm:grid-cols-2">
                <form.Field name="categoryId">
                  {(field) => (
                    <SelectInput
                      id="medicine-category"
                      label="Kategori"
                      onBlur={field.handleBlur}
                      onValueChange={(value) => field.handleChange(value)}
                      options={[
                        { label: "— Tanpa Kategori —", value: "" },
                        ...categoryOptions,
                      ]}
                      placeholder="Pilih kategori"
                      searchable
                      value={field.state.value}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="unit"
                  validators={{
                    onChange: ({ value }) =>
                      !value.trim() ? "Satuan wajib diisi." : undefined,
                  }}
                >
                  {(field) => (
                    <TextInput
                      errorMessage={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : undefined
                      }
                      id="medicine-unit"
                      label="Satuan"
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Contoh: tablet, kapsul, botol"
                      required
                      value={field.state.value}
                    />
                  )}
                </form.Field>
              </section>

              {/* Harga dan status */}
              <section className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="sellingPrice"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Harga jual wajib diisi.";
                      if (isNaN(Number(value)) || Number(value) < 0)
                        return "Harga jual tidak valid.";

                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <TextInput
                      errorMessage={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : undefined
                      }
                      helperText="Masukkan harga dalam Rupiah (tanpa titik/koma)"
                      id="medicine-selling-price"
                      label="Harga Jual (Rp)"
                      min="0"
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Contoh: 5000"
                      required
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>

                <form.Field name="status">
                  {(field) => (
                    <SelectInput
                      id="medicine-status"
                      label="Status"
                      onBlur={field.handleBlur}
                      onValueChange={(value) => field.handleChange(value)}
                      options={STATUS_OPTIONS}
                      required
                      value={field.state.value}
                    />
                  )}
                </form.Field>
              </section>

              {/* Ambang batas stok */}
              <section className="grid gap-4 sm:grid-cols-2">
                <form.Field
                  name="lowStockThreshold"
                  validators={{
                    onChange: ({ value }) => {
                      const num = Number(value);
                      if (isNaN(num) || num < 0)
                        return "Batas stok rendah tidak valid.";

                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <TextInput
                      errorMessage={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : undefined
                      }
                      helperText="Notifikasi stok rendah dikirim saat stok mencapai angka ini"
                      id="medicine-low-stock"
                      label="Batas Stok Rendah"
                      min="0"
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>

                <form.Field
                  name="criticalStockThreshold"
                  validators={{
                    onChange: ({ value }) => {
                      const num = Number(value);
                      if (isNaN(num) || num < 0)
                        return "Batas stok kritis tidak valid.";

                      return undefined;
                    },
                  }}
                >
                  {(field) => (
                    <TextInput
                      errorMessage={
                        field.state.meta.isTouched &&
                        field.state.meta.errors.length > 0
                          ? String(field.state.meta.errors[0])
                          : undefined
                      }
                      helperText="Notifikasi stok kritis dikirim saat stok mencapai angka ini"
                      id="medicine-critical-stock"
                      label="Batas Stok Kritis"
                      min="0"
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type="number"
                      value={field.state.value}
                    />
                  )}
                </form.Field>
              </section>

              {/* Perlu resep */}
              <form.Field name="prescriptionRequired">
                {(field) => (
                  <section className="flex items-center gap-3">
                    <input
                      checked={field.state.value}
                      className="size-4 rounded border-border-default accent-primary-blue"
                      id="medicine-prescription"
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.checked)}
                      type="checkbox"
                    />
                    <label
                      className="ts-sm font-medium text-text-default"
                      htmlFor="medicine-prescription"
                    >
                      Wajib Resep Dokter
                    </label>
                    <span className="ts-sm text-text-muted">
                      Centang jika obat ini termasuk obat keras/narkotika
                    </span>
                  </section>
                )}
              </form.Field>

              {/* Deskripsi */}
              <form.Field name="description">
                {(field) => (
                  <TextareaInput
                    id="medicine-description"
                    label="Deskripsi"
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Deskripsi singkat obat (opsional)"
                    rows={3}
                    value={field.state.value}
                  />
                )}
              </form.Field>

              {/* Tombol aksi */}
              <section className="flex items-center justify-end gap-3 border-t border-border-default pt-4">
                <ButtonLink
                  href={ROUTES.MEDICINES.INDEX}
                  variant="secondary"
                >
                  Batal
                </ButtonLink>
                <form.Subscribe
                  selector={(state) => [state.isSubmitting, state.canSubmit]}
                >
                  {([isSubmitting]) => (
                    <Button
                      disabled={isSubmitting}
                      leftIcon={
                        isSubmitting ? (
                          <Loader2 className="animate-spin" />
                        ) : undefined
                      }
                      type="submit"
                      variant="primary"
                    >
                      {isSubmitting ? "Menyimpan..." : "Simpan Obat"}
                    </Button>
                  )}
                </form.Subscribe>
              </section>
            </section>
          </form>
        </CardContent>
      </Card>
    </DataTableShell>
  );
}
