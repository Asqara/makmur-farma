"use client";

import { MailCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";

import {
  BrandLogo,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  TextInput,
} from "@/components/ui";
import { toast } from "@/components/ui/toast";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { useResendVerificationMutation } from "@/hooks/useAuth";
import { getErrorMessage } from "@/utils/getErrorMessage";

/**
 * Email verification instruction page.
 */
export default function CheckEmailPage() {
  return (
    <Suspense fallback={null}>
      <CheckEmailContent />
    </Suspense>
  );
}

function CheckEmailContent() {
  const searchParams = useSearchParams();
  const initialEmail = useMemo(
    () => searchParams.get("email") ?? "",
    [searchParams],
  );
  const [email, setEmail] = useState(initialEmail);
  const resend = useResendVerificationMutation();

  return (
    <main className="grid min-h-screen place-items-center bg-page-background px-4 py-8">
      <Helmet>
        <title>Periksa Email | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <Card className="w-full max-w-[480px]">
        <CardHeader>
          <section className="grid gap-4">
            <BrandLogo />
            <section className="grid gap-1">
              <CardTitle>Periksa Email Anda</CardTitle>
              <p className="ts-sm text-text-muted">
                Kami telah mengirim tautan verifikasi ke alamat email yang Anda
                daftarkan. Buka tautan tersebut untuk mengaktifkan akun Makmur
                Farma.
              </p>
            </section>
          </section>
        </CardHeader>
        <CardContent className="grid gap-4">
          <section className="flex items-start gap-3 rounded-lg border border-info-border bg-info-bg px-4 py-3 text-info">
            <MailCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p className="ts-sm">
              Jika email belum diterima, periksa folder spam atau kirim ulang
              instruksi verifikasi.
            </p>
          </section>

          <TextInput
            autoComplete="email"
            id="resend-email"
            label="Email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="nama@email.com"
            type="email"
            value={email}
          />

          <Button
            disabled={!email || resend.isPending}
            leftIcon={
              <RefreshCw className={resend.isPending ? "animate-spin" : ""} />
            }
            onClick={async () => {
              try {
                const result = await resend.mutateAsync({ email });
                toast.success(result.message);
              } catch (error) {
                toast.error(
                  getErrorMessage(
                    error,
                    "Email verifikasi gagal dikirim ulang.",
                  ),
                );
              }
            }}
            type="button"
            variant="secondary"
          >
            {resend.isPending ? "Mengirim..." : "Kirim Ulang Email"}
          </Button>

          <Link
            className="ts-sm text-center font-medium text-primary-blue"
            href={ROUTES.LOGIN}
          >
            Kembali ke Halaman Masuk
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
