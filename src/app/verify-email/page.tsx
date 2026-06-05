"use client";

import { AlertTriangle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";

import {
  BrandLogo,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { useVerifyEmailMutation } from "@/hooks/useAuth";

type VerifyState =
  | "already_verified"
  | "expired"
  | "invalid"
  | "processing"
  | "server_error"
  | "success";

/**
 * Email verification result page.
 */
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyShell state="processing" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return null;

  for (const value of Object.values(error as Record<string, unknown>)) {
    if (!value || typeof value !== "object") continue;
    const nested = value as Record<string, unknown>;
    const responseValue = nested.value;

    if (responseValue && typeof responseValue === "object") {
      const payload = responseValue as Record<string, unknown>;
      if (typeof payload.code === "string") return payload.code;
    }
  }

  return null;
}

function VerifyEmailContent() {
  const hasSubmitted = useRef(false);
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const verify = useVerifyEmailMutation();
  const [state, setState] = useState<VerifyState>(
    token ? "processing" : "invalid",
  );

  useEffect(() => {
    if (!token || hasSubmitted.current) {
      return;
    }

    hasSubmitted.current = true;
    verify.mutate(
      { token },
      {
        onError: (error) => {
          const code = getErrorCode(error);

          if (code === "VERIFICATION_TOKEN_EXPIRED") {
            setState("expired");
            return;
          }

          if (code === "INVALID_VERIFICATION_TOKEN") {
            setState("invalid");
            return;
          }

          setState("server_error");
        },
        onSuccess: (result) => {
          setState(
            result.status === "already_verified"
              ? "already_verified"
              : "success",
          );
        },
      },
    );
  }, [token, verify]);

  return <VerifyShell state={state} />;
}

function VerifyShell({ state }: { state: VerifyState }) {
  const isProcessing = state === "processing";
  const isSuccess = state === "success" || state === "already_verified";
  const Icon = isProcessing
    ? Loader2
    : isSuccess
      ? CheckCircle2
      : AlertTriangle;
  const iconClassName = isProcessing
    ? "text-primary-blue"
    : isSuccess
      ? "text-success"
      : "text-danger";
  const title =
    state === "success"
      ? "Email Berhasil Diverifikasi"
      : state === "already_verified"
        ? "Email Ini Sudah Diverifikasi"
        : state === "expired"
          ? "Tautan Verifikasi Sudah Kedaluwarsa"
          : state === "invalid"
            ? "Tautan Verifikasi Tidak Valid"
            : state === "server_error"
              ? "Verifikasi Email Gagal"
              : "Memverifikasi email Anda...";
  const description =
    state === "success"
      ? "Akun Anda sudah aktif. Silakan masuk untuk melanjutkan."
      : state === "already_verified"
        ? "Akun ini sudah aktif. Silakan masuk untuk melanjutkan."
        : state === "expired"
          ? "Kirim ulang email verifikasi untuk mendapatkan tautan baru."
          : state === "invalid"
            ? "Tautan tidak dapat digunakan. Pastikan tautan dibuka dari email terbaru."
            : state === "server_error"
              ? "Server belum dapat memproses verifikasi. Coba beberapa saat lagi."
              : "Mohon tunggu sebentar.";

  return (
    <main className="grid min-h-screen place-items-center bg-page-background px-4 py-8">
      <Helmet>
        <title>Verifikasi Email | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <Card className="w-full max-w-[460px]">
        <CardHeader>
          <section className="grid gap-4">
            <BrandLogo />
            <section className="grid gap-1">
              <CardTitle>{title}</CardTitle>
              <p className="ts-sm text-text-muted">{description}</p>
            </section>
          </section>
        </CardHeader>
        <CardContent className="grid justify-items-center gap-4 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-muted-surface">
            <Icon
              aria-hidden="true"
              className={`${isProcessing ? "animate-spin" : ""} size-7 ${iconClassName}`}
            />
          </span>

          {isSuccess ? (
            <ButtonLink href={ROUTES.LOGIN}>Masuk ke Makmur Farma</ButtonLink>
          ) : null}

          {state === "expired" ? (
            <Link
              className="ts-sm inline-flex items-center gap-2 rounded-lg border border-info-border bg-info-bg px-4 py-3 font-medium text-info"
              href={ROUTES.CHECK_EMAIL}
            >
              <MailCheck aria-hidden="true" className="size-4" />
              Kirim ulang email verifikasi
            </Link>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
