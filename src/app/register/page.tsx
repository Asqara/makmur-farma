"use client";

import { useForm } from "@tanstack/react-form";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { useRegisterMutation } from "@/hooks/useAuth";
import { getFieldError } from "@/utils/formErrors";
import { getErrorMessage } from "@/utils/getErrorMessage";
import {
  PASSWORD_REQUIREMENTS,
  validatePasswordStrength,
} from "@/utils/passwordPolicy";

/**
 * Public customer registration page.
 */
export default function RegisterPage() {
  const register = useRegisterMutation();
  const router = useRouter();
  const form = useForm({
    defaultValues: {
      confirmPassword: "",
      email: "",
      fullName: "",
      password: "",
      phone: "",
      termsAccepted: false,
    },
    onSubmit: async ({ value }) => {
      try {
        const result = await register.mutateAsync({
          ...value,
          termsAccepted: value.termsAccepted as true,
        });

        toast.success("Registrasi berhasil. Silakan periksa email Anda.");
        router.replace(
          `${ROUTES.CHECK_EMAIL}?email=${encodeURIComponent(result.email)}`,
        );
      } catch (error) {
        toast.error(
          getErrorMessage(error, "Registrasi gagal. Periksa data Anda."),
        );
      }
    },
  });

  return (
    <main className="grid min-h-screen place-items-center bg-page-background px-4 py-8">
      <Helmet>
        <title>Daftar Pelanggan | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <Card className="w-full max-w-[520px]">
        <CardHeader>
          <section className="grid gap-4">
            <BrandLogo />
            <section className="grid gap-1">
              <CardTitle>Buat Akun Pelanggan</CardTitle>
              <p className="ts-sm text-text-muted">
                Daftar untuk membeli obat dan memantau status pesanan Anda.
              </p>
            </section>
          </section>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              event.stopPropagation();
              form.handleSubmit();
            }}
          >
            <form.Field
              name="fullName"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "Nama lengkap wajib diisi.";
                  if (value.trim().length < 3) {
                    return "Nama lengkap minimal 3 karakter.";
                  }

                  return undefined;
                },
              }}
            >
              {(field) => (
                <TextInput
                  autoComplete="name"
                  errorMessage={getFieldError(field.state.meta.errors)}
                  id={field.name}
                  label="Nama lengkap"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Nama sesuai identitas"
                  required
                  value={field.state.value}
                />
              )}
            </form.Field>

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
              name="phone"
              validators={{
                onChange: ({ value }) => {
                  if (!value.trim()) return "Nomor telepon wajib diisi.";
                  if (!/^[+0-9][0-9\s-]{7,19}$/.test(value.trim())) {
                    return "Nomor telepon tidak valid.";
                  }

                  return undefined;
                },
              }}
            >
              {(field) => (
                <TextInput
                  autoComplete="tel"
                  errorMessage={getFieldError(field.state.meta.errors)}
                  id={field.name}
                  label="Nomor telepon"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="081234567890"
                  required
                  type="tel"
                  value={field.state.value}
                />
              )}
            </form.Field>

            <form.Field
              name="password"
              validators={{
                onChange: ({ value }) => {
                  const validation = validatePasswordStrength(value);

                  return validation.isValid
                    ? undefined
                    : validation.messages[0];
                },
              }}
            >
              {(field) => (
                <PasswordInput
                  autoComplete="new-password"
                  errorMessage={getFieldError(field.state.meta.errors)}
                  helperText={PASSWORD_REQUIREMENTS.join(" ")}
                  id={field.name}
                  label="Password"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Buat password"
                  required
                  value={field.state.value}
                />
              )}
            </form.Field>

            <form.Field
              name="confirmPassword"
              validators={{
                onChangeListenTo: ["password"],
                onChange: ({ fieldApi, value }) => {
                  const password = fieldApi.form.getFieldValue("password");

                  if (!value) return "Konfirmasi password wajib diisi.";
                  if (value !== password) return "Konfirmasi password tidak sama.";

                  return undefined;
                },
              }}
            >
              {(field) => (
                <PasswordInput
                  autoComplete="new-password"
                  errorMessage={getFieldError(field.state.meta.errors)}
                  id={field.name}
                  label="Konfirmasi password"
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="Ulangi password"
                  required
                  value={field.state.value}
                />
              )}
            </form.Field>

            <form.Field
              name="termsAccepted"
              validators={{
                onChange: ({ value }) =>
                  value
                    ? undefined
                    : "Persetujuan syarat dan kebijakan privasi wajib dicentang.",
              }}
            >
              {(field) => (
                <label className="ts-sm flex items-start gap-3 rounded-lg border border-border-default bg-muted-surface px-3 py-3 text-text-default">
                  <input
                    checked={field.state.value}
                    className="mt-1 size-4 accent-primary-blue"
                    onBlur={field.handleBlur}
                    onChange={(event) =>
                      field.handleChange(event.target.checked)
                    }
                    type="checkbox"
                  />
                  <span>
                    Saya menyetujui penggunaan data akun untuk layanan Makmur
                    Farma.
                    {getFieldError(field.state.meta.errors) ? (
                      <span className="block text-danger">
                        {getFieldError(field.state.meta.errors)}
                      </span>
                    ) : null}
                  </span>
                </label>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button
                  disabled={!canSubmit || isSubmitting || register.isPending}
                  leftIcon={<UserPlus />}
                  type="submit"
                >
                  {isSubmitting || register.isPending ? "Memproses..." : "Daftar"}
                </Button>
              )}
            </form.Subscribe>
          </form>

          <p className="ts-sm text-center text-text-muted">
            Sudah memiliki akun?{" "}
            <Link className="font-medium text-primary-blue" href={ROUTES.LOGIN}>
              Masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
