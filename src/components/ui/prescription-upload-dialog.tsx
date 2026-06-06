"use client";

import { FileText, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { CSRF_HEADER_NAME } from "@/constants/auth";
import { CSRF_COOKIE_NAME } from "@/constants/cookies";
import {
  PRESCRIPTION_FILE_ALLOWED_MIME_TYPES,
  PRESCRIPTION_FILE_LIMIT_BYTES,
} from "@/constants/upload";
import { parseCookieHeader } from "@/utils/cookies";
import { mc } from "@/utils/mc";

import { Button } from "./button";
import { Dialog } from "./dialog";

export type PrescriptionUploadDialogProps = {
  onClose: () => void;
  onSuccess: () => void;
  open: boolean;
  orderId: string;
  orderNumber: string;
};

const ALLOWED_TYPES = PRESCRIPTION_FILE_ALLOWED_MIME_TYPES as readonly string[];
const MAX_SIZE_MB = PRESCRIPTION_FILE_LIMIT_BYTES / (1024 * 1024);

/**
 * Dialog for customers to upload a prescription document for a specific order.
 * Submits via multipart/form-data to the backend and validates both client-side
 * and server-side.
 */
export function PrescriptionUploadDialog({
  onClose,
  onSuccess,
  open,
  orderId,
  orderNumber,
}: PrescriptionUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);

    if (!selected) {
      setFile(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError("Format file tidak didukung. Gunakan PDF, JPG, atau PNG.");
      setFile(null);
      return;
    }

    if (selected.size > PRESCRIPTION_FILE_LIMIT_BYTES) {
      setError(`Ukuran file melebihi batas ${MAX_SIZE_MB} MB.`);
      setFile(null);
      return;
    }

    setFile(selected);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || uploading) return;

    setUploading(true);
    setError(null);

    try {
      const csrfToken =
        parseCookieHeader(document.cookie)[CSRF_COOKIE_NAME] ?? "";
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/v1/orders/${orderId}/prescription`, {
        body: formData,
        credentials: "include",
        headers: { [CSRF_HEADER_NAME]: csrfToken },
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const message = (data as Record<string, unknown>).message;
        throw new Error(
          typeof message === "string"
            ? message
            : "Gagal mengunggah resep.",
        );
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Resep belum berhasil diunggah. Periksa format file dan coba kembali.",
      );
    } finally {
      setUploading(false);
    }
  }

  function handleClose() {
    if (uploading) return;
    setFile(null);
    setError(null);
    setSuccess(false);
    if (inputRef.current) inputRef.current.value = "";
    onClose();
  }

  return (
    <Dialog
      description={`Pesanan ${orderNumber}`}
      footer={
        <>
          <Button
            disabled={uploading}
            onClick={handleClose}
            variant="secondary"
          >
            Batal
          </Button>
          <Button
            disabled={!file || uploading || success}
            form="prescription-upload-form"
            leftIcon={
              uploading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Upload />
              )
            }
            type="submit"
          >
            {uploading
              ? "Mengunggah..."
              : success
                ? "Berhasil Diunggah"
                : "Unggah Resep"}
          </Button>
        </>
      }
      id="prescription-upload-dialog"
      onClose={uploading ? undefined : handleClose}
      open={open}
      title="Unggah Resep"
    >
      <form id="prescription-upload-form" onSubmit={handleSubmit}>
        <section className="grid gap-4">
          <p className="ts-sm text-text-muted">
            Unggah dokumen resep dari dokter. Format yang didukung: PDF, JPG,
            PNG. Ukuran maksimal {MAX_SIZE_MB} MB.
          </p>

          <label
            className={mc(
              "flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              file
                ? "border-primary-blue-border bg-primary-blue-soft"
                : "border-border-default bg-muted-surface hover:border-primary-blue-border hover:bg-primary-blue-soft",
              uploading && "cursor-not-allowed opacity-60",
            )}
            htmlFor="prescription-file-input"
          >
            <FileText
              aria-hidden="true"
              className={mc(
                "size-8",
                file ? "text-primary-blue" : "text-text-muted",
              )}
            />
            {file ? (
              <section className="grid gap-1">
                <p className="ts-sm max-w-48 truncate font-medium text-text-strong">
                  {file.name}
                </p>
                <p className="ts-xs text-text-muted">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </section>
            ) : (
              <section className="grid gap-1">
                <p className="ts-sm font-medium text-text-strong">
                  Klik untuk pilih file
                </p>
                <p className="ts-xs text-text-muted">
                  PDF, JPG, PNG hingga {MAX_SIZE_MB} MB
                </p>
              </section>
            )}
            <input
              accept={ALLOWED_TYPES.join(",")}
              className="sr-only"
              disabled={uploading}
              id="prescription-file-input"
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

          {success && (
            <p
              aria-live="polite"
              className="ts-sm rounded-lg bg-success-bg px-4 py-3 text-success"
              role="status"
            >
              Resep berhasil diunggah. Menunggu verifikasi Apoteker.
            </p>
          )}
        </section>
      </form>
    </Dialog>
  );
}
