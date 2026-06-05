"use client";

import { useForm } from "@tanstack/react-form";
import { LogIn, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Helmet } from "react-helmet-async";

import {
  BrandLogo,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PasswordInput,
  TextInput,
} from "@/components/ui";
import { toast } from "@/components/ui/toast";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { useLoginMutation } from "@/hooks/useAuth";
import { getFieldError } from "@/utils/formErrors";
import { getErrorMessage } from "@/utils/getErrorMessage";

/**
 * Login page for Makmur Farma.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-page-background p-6">
      <section className="grid gap-4 text-center">
        <BrandLogo className="mx-auto" />
        <p className="ts-sm text-text-muted">Memuat halaman masuk...</p>
      </section>
    </main>
  );
}

function getReasonMessage(reason: string | null) {
  if (reason === "session-expired") {
    return "Sesi Anda telah berakhir. Silakan masuk kembali.";
  }

  if (reason === "logout") {
    return "Anda telah keluar dari Makmur Farma.";
  }

  return null;
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

function LoginPageContent() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorCode, setSubmitErrorCode] = useState<string | null>(null);
  const [lastEmail, setLastEmail] = useState("");
  const login = useLoginMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const reasonMessage = getReasonMessage(searchParams.get("reason"));
  const redirectTo = searchParams.get("redirectTo") ?? undefined;
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);
      setSubmitErrorCode(null);
      setLastEmail(value.email);

      try {
        const result = await login.mutateAsync({
          ...value,
          redirectTo,
        });

        toast.success("Berhasil masuk ke Makmur Farma.");
        router.replace(result.redirectTo);
      } catch (error) {
        const message = getErrorMessage(
          error,
          "Email atau password tidak sesuai.",
        );

        toast.error(message);
        setSubmitError(message);
        setSubmitErrorCode(getErrorCode(error));
      }
    },
  });
  const displayErrorMessage = submitError ?? reasonMessage;
  const isEmailNotVerified =
    submitError && submitErrorCode === "EMAIL_NOT_VERIFIED";

  return (
    <main className="grid min-h-screen place-items-center bg-page-background px-4 py-8">
      <Helmet>
        <title>Masuk | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <Card className="w-full max-w-[460px]">
        <CardHeader>
          <section className="grid gap-4">
            <BrandLogo />
            <section className="grid gap-1">
              <CardTitle>Selamat Datang</CardTitle>
              <p className="ts-sm text-text-muted">
                Masuk ke Makmur Farma untuk melanjutkan.
              </p>
            </section>
          </section>
        </CardHeader>
        <CardContent className="grid gap-4">
          {displayErrorMessage ? (
            <section className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-danger">
              <p className="ts-sm font-medium">{displayErrorMessage}</p>
            </section>
          ) : null}

          {isEmailNotVerified ? (
            <Link
              className="ts-sm inline-flex items-center gap-2 rounded-lg border border-info-border bg-info-bg px-4 py-3 text-info"
              href={`${ROUTES.CHECK_EMAIL}?email=${encodeURIComponent(lastEmail)}`}
            >
              <MailCheck aria-hidden="true" className="size-4" />
              Kirim ulang email verifikasi
            </Link>
          ) : null}

          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field
              name="email"
              validators={{
                onChange: ({ value }) => {
                  if (!value) return "Email wajib diisi.";
                  if (!value.includes("@")) return "Email tidak valid.";

                  return undefined;
                },
              }}
            >
              {(field) => (
                <TextInput
                  autoComplete="email"
                  errorMessage={getFieldError(field.state.meta.errors)}
                  id={field.name}
                  label="Email"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="nama@email.com"
                  required
                  type="email"
                  value={field.state.value}
                />
              )}
            </form.Field>
            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) =>
                  value ? undefined : "Password wajib diisi.",
              }}
            >
              {(field) => (
                <PasswordInput
                  autoComplete="current-password"
                  errorMessage={getFieldError(field.state.meta.errors)}
                  id={field.name}
                  label="Password"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Masukkan password"
                  required
                  value={field.state.value}
                />
              )}
            </form.Field>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  disabled={!canSubmit || isSubmitting || login.isPending}
                  leftIcon={<LogIn />}
                  type="submit"
                >
                  {isSubmitting || login.isPending ? "Memproses..." : "Masuk"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="ts-sm text-center text-text-muted">
            Belum memiliki akun?{" "}
            <Link className="font-medium text-primary-blue" href={ROUTES.REGISTER}>
              Daftar sebagai pelanggan
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
