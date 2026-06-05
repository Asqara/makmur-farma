"use client";

import { useForm } from "@tanstack/react-form";
import { EyeOff, ShieldCheck } from "lucide-react";
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
import { APP_META_DESCRIPTION } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { eden } from "@/lib/eden";
import { getFieldError } from "@/utils/formErrors";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { toast } from "@/components/ui/toast";

/**
 * Login page for SmartStock Pro.
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
        <p className="ts-sm text-text-muted">Memuat halaman login...</p>
      </section>
    </main>
  );
}

function LoginPageContent() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const sessionExpiredMessage =
    reason === "session-expired"
      ? "Session Anda telah berakhir. Silakan masuk kembali."
      : null;
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setSubmitError(null);

      const response = await eden.api.v1.auth.login.post(value);

      if (response.error) {
        const message = getErrorMessage(
          response.error,
          "Email atau password salah."
        );

        toast.error(message);
        setSubmitError(message);

        return;
      }

      router.replace(ROUTES.DASHBOARD);
    },
  });

  let errorNode = null;

  const displayErrorMessage = submitError ?? sessionExpiredMessage;

  if (displayErrorMessage) {
    errorNode = (
      <section className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-danger">
        <p className="ts-sm font-medium">{displayErrorMessage}</p>
      </section>
    );
  }

  return (
    <main className="grid min-h-screen bg-page-background lg:grid-cols-[minmax(0,1fr)_520px]">
      <Helmet>
        <title>Masuk ke SmartStock Pro | SmartStock Pro</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>
      <section className="hidden bg-primary-navy px-12 py-10 text-text-inverse lg:grid">
        <section className="flex h-full flex-col justify-between">
          <BrandLogo className="brightness-0 invert" />
          <section className="grid max-w-xl gap-6">
            <BadgePanel />
            <section className="grid gap-3">
              <h1 className="ts-3xl text-text-inverse">
                Kontrol akses untuk operasional gudang.
              </h1>
              <p className="ts-base max-w-lg text-sidebar-text">
                Session aman, validasi permission, dan audit log aktif untuk
                setiap aksi penting.
              </p>
            </section>
          </section>
          <p className="ts-xs text-sidebar-muted">
            PT Maju Bersama Digital
          </p>
        </section>
      </section>
      <section className="grid place-items-center px-4 py-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <section className="grid gap-3">
              <BrandLogo />
              <section className="grid gap-1">
                <CardTitle>Masuk ke SmartStock Pro</CardTitle>
                <p className="ts-sm text-text-muted">
                  Gunakan email dan password yang diberikan admin.
                </p>
              </section>
            </section>
          </CardHeader>
          <CardContent>
            {errorNode}
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
                    if (!value) {
                      return "Email wajib diisi.";
                    }

                    if (!value.includes("@")) {
                      return "Email tidak valid.";
                    }

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
                    placeholder="admin@smartstock.test"
                    required
                    type="email"
                    value={field.state.value}
                  />
                )}
              </form.Field>
              <form.Field
                name="password"
                validators={{
                  onChange: ({ value }) => {
                    if (!value) {
                      return "Password wajib diisi.";
                    }

                    return undefined;
                  },
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
                    disabled={!canSubmit || isSubmitting}
                    leftIcon={<ShieldCheck />}
                    type="submit"
                  >
                    {isSubmitting ? "Memproses..." : "Masuk"}
                  </Button>
                )}
              </form.Subscribe>
            </form>
            <section className="rounded-lg border border-border-default bg-muted-surface px-4 py-3">
              <p className="ts-sm text-text-muted">
                Lupa password? Minta admin untuk reset password akun.
              </p>
            </section>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function BadgePanel() {
  return (
    <section className="inline-flex w-fit items-center gap-2 rounded-full border border-sidebar-border bg-sidebar-hover px-3 py-2">
      <EyeOff aria-hidden="true" className="size-4 text-operational-cyan" />
      <span className="ts-sm text-sidebar-text">Session cookie httpOnly</span>
    </section>
  );
}
