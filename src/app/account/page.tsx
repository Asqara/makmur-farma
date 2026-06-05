"use client";

import { LogOut, PackageSearch, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Helmet } from "react-helmet-async";

import {
  Badge,
  BrandLogo,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { isUnauthorizedError, useAuth } from "@/hooks/useAuth";

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Protected customer account page.
 */
export default function AccountPage() {
  const auth = useAuth();
  const router = useRouter();
  const user = auth.data?.user;

  useEffect(() => {
    if (auth.isError && isUnauthorizedError(auth.error)) {
      router.replace(`${ROUTES.LOGIN}?reason=session-expired`);
    }
  }, [auth.error, auth.isError, router]);

  useEffect(() => {
    if (user && user.role !== "CUSTOMER") {
      router.replace(ROUTES.DASHBOARD);
    }
  }, [router, user]);

  if (auth.isLoading || !user) {
    return (
      <main className="min-h-screen bg-page-background px-4 py-6">
        <section className="mx-auto grid max-w-5xl gap-6">
          <BrandLogo />
          <Skeleton className="h-48" />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page-background px-4 py-6">
      <Helmet>
        <title>Akun Saya | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <section className="mx-auto grid max-w-5xl gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[10px] border border-border-default bg-card-surface px-5 py-4 shadow-card">
          <BrandLogo />
          <nav className="flex items-center gap-3" aria-label="Menu akun">
            <Link className="ts-sm text-text-default" href={ROUTES.ACCOUNT}>
              Akun
            </Link>
            <ButtonLink
              href={ROUTES.LOGOUT}
              leftIcon={<LogOut />}
              variant="secondary"
            >
              Keluar
            </ButtonLink>
          </nav>
        </header>

        <Card>
          <CardHeader>
            <section className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-primary-blue-soft text-primary-blue">
                <UserRound aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <CardTitle>{user.name}</CardTitle>
                <p className="ts-sm text-text-muted">{user.email}</p>
              </section>
            </section>
            <Badge tone="success" showDot>
              {USER_STATUS_LABELS[user.status]}
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <section className="grid gap-1 rounded-lg bg-muted-surface p-4">
              <p className="ts-xs text-text-muted">Role</p>
              <p className="ts-sm font-semibold text-text-strong">
                {USER_ROLE_LABELS[user.role]}
              </p>
            </section>
            <section className="grid gap-1 rounded-lg bg-muted-surface p-4">
              <p className="ts-xs text-text-muted">Email diverifikasi</p>
              <p className="ts-sm font-semibold text-text-strong">
                {formatDateTime(user.emailVerifiedAt)}
              </p>
            </section>
            <section className="grid gap-1 rounded-lg bg-muted-surface p-4">
              <p className="ts-xs text-text-muted">Nomor telepon</p>
              <p className="ts-sm font-semibold text-text-strong">
                {user.phone ?? "-"}
              </p>
            </section>
            <section className="grid gap-1 rounded-lg bg-muted-surface p-4">
              <p className="ts-xs text-text-muted">Login terakhir</p>
              <p className="ts-sm font-semibold text-text-strong">
                {formatDateTime(user.lastLoginAt)}
              </p>
            </section>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <section className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-info-bg text-info">
                <PackageSearch aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <CardTitle>Pesanan Saya</CardTitle>
                <p className="ts-sm text-text-muted">
                  Riwayat pesanan akan ditampilkan setelah modul pesanan
                  pelanggan tersedia.
                </p>
              </section>
            </section>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
