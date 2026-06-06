"use client";

import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { CSRF_HEADER_NAME } from "@/constants/auth";
import { CSRF_COOKIE_NAME } from "@/constants/cookies";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { parseCookieHeader } from "@/utils/cookies";
import { mc } from "@/utils/mc";

import { Button } from "./button";
import { ButtonLink } from "./button";
import { Dialog } from "./dialog";
import { SelectInput } from "./field";

type ImportField = {
  key: string;
  label: string;
  required: boolean;
};

const IMPORT_FIELDS: ImportField[] = [
  { key: "medicineName", label: "Nama Obat", required: true },
  { key: "sellingPrice", label: "Harga Jual", required: true },
  { key: "medicineCode", label: "Kode Obat", required: false },
  { key: "category", label: "Kategori", required: false },
  { key: "unit", label: "Satuan", required: false },
  { key: "description", label: "Deskripsi", required: false },
  { key: "prescriptionRequired", label: "Perlu Resep (ya/tidak)", required: false },
  { key: "lowStockThreshold", label: "Batas Stok Rendah", required: false },
  { key: "criticalStockThreshold", label: "Batas Stok Kritis", required: false },
  { key: "batchNumber", label: "Nomor Batch", required: false },
  { key: "receivedDate", label: "Tanggal Masuk (YYYY-MM-DD)", required: false },
  { key: "expiryDate", label: "Tanggal Kedaluwarsa (YYYY-MM-DD)", required: false },
  { key: "purchaseCost", label: "Harga Beli", required: false },
  { key: "openingQuantity", label: "Stok Awal", required: false },
  { key: "supplier", label: "Nama Supplier", required: false },
];

const FIELD_ALIASES: Record<string, string[]> = {
  medicineName: ["medicinename", "medicine_name", "nama obat", "nama", "name"],
  sellingPrice: ["sellingprice", "selling_price", "harga jual", "harga", "price"],
  medicineCode: ["medicinecode", "medicine_code", "kode obat", "kode", "code"],
  category: ["category", "kategori"],
  unit: ["unit", "satuan"],
  description: ["description", "deskripsi", "keterangan"],
  prescriptionRequired: ["prescriptionrequired", "prescription_required", "resep", "perlu resep"],
  lowStockThreshold: ["lowstockthreshold", "low_stock_threshold", "batas stok rendah"],
  criticalStockThreshold: ["criticalstockthreshold", "critical_stock_threshold", "batas stok kritis"],
  batchNumber: ["batchnumber", "batch_number", "batch", "no batch", "nomor batch"],
  receivedDate: ["receiveddate", "received_date", "tanggal masuk", "tanggal terima"],
  expiryDate: ["expirydate", "expiry_date", "kadaluarsa", "kedaluwarsa", "expired", "tanggal kedaluwarsa"],
  purchaseCost: ["purchasecost", "purchase_cost", "harga beli", "harga pokok"],
  openingQuantity: ["openingquantity", "opening_quantity", "stok awal", "quantity", "qty"],
  supplier: ["supplier", "nama supplier", "pemasok"],
};

function autoMap(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const lowerHeaders = headers.map((h) => h.toLowerCase());

  for (const field of IMPORT_FIELDS) {
    const aliases = FIELD_ALIASES[field.key] ?? [field.key.toLowerCase()];
    for (const alias of aliases) {
      const idx = lowerHeaders.indexOf(alias);
      if (idx >= 0) {
        mapping[field.key] = headers[idx] as string;
        break;
      }
    }
  }

  return mapping;
}

type Step = "upload" | "map" | "confirm" | "done";

type UploadResult = {
  fileName: string;
  headers: string[];
  objectKey: string;
  sizeBytes: number;
};

export type MedicineImportDialogProps = {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
};

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Multi-step dialog to import medicines from an Excel (.xlsx/.xls) or CSV file.
 * Steps: Upload → Map Columns → Confirm → Done.
 */
export function MedicineImportDialog({
  onClose,
  onSuccess,
  open,
}: MedicineImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importRunId, setImportRunId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    const ext = "." + (selected.name.split(".").pop()?.toLowerCase() ?? "");

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Format file tidak didukung. Gunakan XLSX, XLS, atau CSV.");
      setFile(null);
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError(`Ukuran file melebihi batas ${MAX_FILE_SIZE_MB} MB.`);
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleUpload() {
    if (!file || uploading) return;
    setUploading(true);
    setError(null);

    try {
      const csrfToken = parseCookieHeader(document.cookie)[CSRF_COOKIE_NAME] ?? "";
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/v1/imports/upload", {
        body: formData,
        credentials: "include",
        headers: { [CSRF_HEADER_NAME]: csrfToken },
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = (data as Record<string, unknown>).message;
        throw new Error(
          typeof message === "string" ? message : "Gagal mengunggah file.",
        );
      }

      const result = (await response.json()) as UploadResult;
      setUploadResult(result);
      setMapping(autoMap(result.headers));
      setStep("map");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah file.");
    } finally {
      setUploading(false);
    }
  }

  function handleMappingChange(fieldKey: string, value: string) {
    setMapping((prev) => ({ ...prev, [fieldKey]: value }));
  }

  function handleToConfirm() {
    setError(null);
    const missingRequired = IMPORT_FIELDS.filter(
      (f) => f.required && !mapping[f.key],
    );

    if (missingRequired.length > 0) {
      setError(
        `Wajib petakan: ${missingRequired.map((f) => f.label).join(", ")}.`,
      );
      return;
    }

    setStep("confirm");
  }

  async function handleSubmit() {
    if (!uploadResult || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const cleanMapping: Record<string, string> = {};
      for (const [key, value] of Object.entries(mapping)) {
        if (value) cleanMapping[key] = value;
      }

      const response = await eden.api.v1.imports.post({
        fileSizeBytes: uploadResult.sizeBytes,
        mapping: cleanMapping,
        originalFileName: uploadResult.fileName,
        sourceFileObjectKey: uploadResult.objectKey,
        type: "MEDICINE",
      });

      if (response.error) throw response.error;

      setImportRunId((response.data as { id?: string }).id ?? null);
      setStep("done");
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal membuat import. Coba lagi.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    if (uploading || submitting) return;
    setStep("upload");
    setFile(null);
    setUploadResult(null);
    setMapping({});
    setError(null);
    setImportRunId(null);
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  }

  const headerOptions = uploadResult
    ? uploadResult.headers.map((h) => ({ label: h, value: h }))
    : [];

  const skipOption = { label: "(Lewati kolom ini)", value: "" };

  const dialogTitle =
    step === "done" ? "Import Diantrekan" : "Import Obat dari Excel / CSV";

  const dialogDescription =
    step === "upload"
      ? "Format yang didukung: XLSX, XLS, CSV. Maksimal 10 MB."
      : step === "map"
        ? `${uploadResult?.headers.length ?? 0} kolom terdeteksi — ${uploadResult?.fileName ?? ""}`
        : step === "confirm"
          ? "Periksa pemetaan sebelum memulai import."
          : "Import berhasil masuk antrean background job.";

  return (
    <Dialog
      className="max-w-2xl"
      description={dialogDescription}
      footer={
        step === "upload" ? (
          <>
            <Button disabled={uploading} onClick={handleClose} variant="secondary">
              Batal
            </Button>
            <Button
              disabled={!file || uploading}
              leftIcon={uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              onClick={handleUpload}
            >
              {uploading ? "Mengunggah..." : "Unggah & Deteksi Kolom"}
            </Button>
          </>
        ) : step === "map" ? (
          <>
            <Button
              onClick={() => {
                setStep("upload");
                setError(null);
              }}
              variant="secondary"
            >
              Kembali
            </Button>
            <Button onClick={handleToConfirm}>Lanjutkan</Button>
          </>
        ) : step === "confirm" ? (
          <>
            <Button
              onClick={() => {
                setStep("map");
                setError(null);
              }}
              variant="secondary"
            >
              Kembali
            </Button>
            <Button
              disabled={submitting}
              leftIcon={submitting ? <Loader2 className="animate-spin" /> : undefined}
              onClick={handleSubmit}
            >
              {submitting ? "Memproses..." : "Mulai Import"}
            </Button>
          </>
        ) : (
          <>
            <ButtonLink href={ROUTES.IMPORTS.INDEX} variant="secondary">
              Lihat Status Import
            </ButtonLink>
            <Button onClick={handleClose}>Tutup</Button>
          </>
        )
      }
      id="medicine-import-dialog"
      onClose={uploading || submitting ? undefined : handleClose}
      open={open}
      title={dialogTitle}
    >
      {step === "upload" && (
        <section className="grid gap-4">
          <p className="ts-sm text-text-muted">
            File harus memiliki baris header di baris pertama. Kolom{" "}
            <strong>Nama Obat</strong> dan <strong>Harga Jual</strong> wajib ada.
            Batch stok opsional — jika disertakan, wajib mengisi Nomor Batch,
            Tanggal Masuk, Tanggal Kedaluwarsa, Harga Beli, dan Stok Awal.
          </p>

          <a
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-border-default bg-muted-surface px-3 py-2 ts-sm text-text-strong transition-colors hover:bg-primary-blue-soft hover:border-primary-blue-border"
            download
            href="/api/v1/imports/template"
          >
            <Download aria-hidden="true" className="size-4 shrink-0" />
            Unduh Template Excel
          </a>

          <label
            className={mc(
              "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              file
                ? "border-primary-blue-border bg-primary-blue-soft"
                : "border-border-default bg-muted-surface hover:border-primary-blue-border hover:bg-primary-blue-soft",
              uploading && "cursor-not-allowed opacity-60",
            )}
            htmlFor="import-medicine-file-input"
          >
            <FileSpreadsheet
              aria-hidden="true"
              className={mc("size-8", file ? "text-primary-blue" : "text-text-muted")}
            />
            {file ? (
              <section className="grid gap-1">
                <p className="ts-sm max-w-56 truncate font-medium text-text-strong">
                  {file.name}
                </p>
                <p className="ts-xs text-text-muted">
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              </section>
            ) : (
              <section className="grid gap-1">
                <p className="ts-sm font-medium text-text-strong">
                  Klik untuk pilih file
                </p>
                <p className="ts-xs text-text-muted">
                  XLSX, XLS, CSV hingga {MAX_FILE_SIZE_MB} MB
                </p>
              </section>
            )}
            <input
              accept=".xlsx,.xls,.csv"
              className="sr-only"
              disabled={uploading}
              id="import-medicine-file-input"
              onChange={handleFileChange}
              ref={inputRef}
              type="file"
            />
          </label>

          {error && (
            <p
              aria-live="polite"
              className="ts-sm rounded-lg bg-danger-bg px-4 py-3 text-danger"
              role="alert"
            >
              {error}
            </p>
          )}
        </section>
      )}

      {step === "map" && uploadResult && (
        <section className="grid gap-4">
          <p className="ts-sm text-text-muted">
            Petakan kolom dari file ke field obat. Field bertanda{" "}
            <span aria-hidden="true" className="text-danger">
              *
            </span>{" "}
            wajib dipetakan.
          </p>

          <section className="grid gap-3">
            {IMPORT_FIELDS.map((field) => (
              <SelectInput
                key={field.key}
                id={`map-${field.key}`}
                label={field.required ? `${field.label} *` : field.label}
                options={
                  field.required ? headerOptions : [skipOption, ...headerOptions]
                }
                placeholder="(Lewati kolom ini)"
                value={mapping[field.key] ?? ""}
                onValueChange={(v) => handleMappingChange(field.key, v)}
              />
            ))}
          </section>

          {error && (
            <p
              aria-live="polite"
              className="ts-sm rounded-lg bg-danger-bg px-4 py-3 text-danger"
              role="alert"
            >
              {error}
            </p>
          )}
        </section>
      )}

      {step === "confirm" && uploadResult && (
        <section className="grid gap-4">
          <p className="ts-sm text-text-muted">
            Import akan diproses di latar belakang. Pantau hasilnya di halaman{" "}
            <strong>Import Obat</strong>.
          </p>

          <section className="overflow-auto rounded-lg border border-border-default">
            <table className="w-full ts-sm">
              <thead>
                <tr className="bg-muted-surface">
                  <th className="px-3 py-2 text-left font-medium text-text-muted">
                    Field Obat
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-text-muted">
                    Kolom di File
                  </th>
                </tr>
              </thead>
              <tbody>
                {IMPORT_FIELDS.map((field) => {
                  const col = mapping[field.key];
                  if (!col && !field.required) return null;
                  return (
                    <tr
                      className="border-t border-border-default"
                      key={field.key}
                    >
                      <td className="px-3 py-2 text-text-strong">
                        {field.label}
                        {field.required && (
                          <span aria-hidden="true" className="ml-1 text-danger">
                            *
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {col ? (
                          <code className="rounded bg-success-bg px-2 py-0.5 text-xs text-success">
                            {col}
                          </code>
                        ) : (
                          <span className="text-text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {error && (
            <p
              aria-live="polite"
              className="ts-sm rounded-lg bg-danger-bg px-4 py-3 text-danger"
              role="alert"
            >
              {error}
            </p>
          )}
        </section>
      )}

      {step === "done" && (
        <section className="grid gap-4">
          <p
            aria-live="polite"
            className="ts-sm rounded-lg bg-success-bg px-4 py-3 text-success"
            role="status"
          >
            Import berhasil diantrekan. Worker akan memproses setiap baris
            secara bertahap.
          </p>
          {importRunId && (
            <p className="ts-xs text-text-muted font-mono">
              ID: {importRunId}
            </p>
          )}
          <p className="ts-sm text-text-muted">
            Buka halaman <strong>Import Obat</strong> untuk memantau progres dan
            melihat baris yang berhasil atau gagal.
          </p>
        </section>
      )}
    </Dialog>
  );
}
