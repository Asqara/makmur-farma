"use client";

import { useQuery } from "@tanstack/react-query";
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
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
} from "@/components/ui";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/constants/auth";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONES,
  PRESCRIPTION_STATUS_LABELS,
  PRESCRIPTION_STATUS_TONES,
  type OrderStatus,
  type PrescriptionStatus,
} from "@/constants/domain";
import { ROUTES } from "@/constants/routes";
import { isUnauthorizedError, useAuth } from "@/hooks/useAuth";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

type AccountOrdersResponse = {
  data: Array<{
    createdAt: Date | string;
    grandTotal: string;
    id: string;
    itemCount: number;
    orderNumber: string;
    prescriptionRequired: boolean;
    status: OrderStatus;
  }>;
};

type AccountPrescriptionsResponse = {
  data: Array<{
    id: string;
    latestNote: string | null;
    order: {
      id: string;
      orderNumber: string;
      status: OrderStatus;
    };
    originalFileName: string;
    status: PrescriptionStatus;
    submittedAt: Date | string;
  }>;
};

/**
 * Protected customer account page.
 */
export default function AccountPage() {
  const auth = useAuth();
  const router = useRouter();
  const user = auth.data?.user;
  const ordersQuery = useQuery({
    enabled: Boolean(user && user.role === "CUSTOMER"),
    queryFn: async () => {
      const response = await eden.api.v1.account.orders.get({
        query: { limit: "5", page: "1", sortBy: "createdAt", sortDir: "desc" },
      });
      if (response.error) throw response.error;
      return response.data as AccountOrdersResponse;
    },
    queryKey: ["account", "orders"],
  });
  const prescriptionsQuery = useQuery({
    enabled: Boolean(user && user.role === "CUSTOMER"),
    queryFn: async () => {
      const response = await eden.api.v1.account.prescriptions.get({
        query: { limit: "5", page: "1", sortBy: "submittedAt", sortDir: "desc" },
      });
      if (response.error) throw response.error;
      return response.data as AccountPrescriptionsResponse;
    },
    queryKey: ["account", "prescriptions"],
  });

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
                  Riwayat pesanan online dan transaksi kasir yang terhubung
                  dengan akun Anda.
                </p>
              </section>
            </section>
          </CardHeader>
          <CardContent>
            {ordersQuery.isError ? (
              <ErrorState
                description="Riwayat pesanan gagal dimuat."
                onRetry={() => ordersQuery.refetch()}
                title="Riwayat Tidak Tersedia"
              />
            ) : ordersQuery.data?.data.length ? (
              <section className="grid gap-3">
                {ordersQuery.data.data.map((order) => (
                  <article
                    className="grid gap-2 rounded-lg border border-border-default p-4 md:grid-cols-[1fr_auto]"
                    key={order.id}
                  >
                    <section className="grid gap-1">
                      <p className="ts-sm font-semibold text-text-strong">
                        {order.orderNumber}
                      </p>
                      <p className="ts-xs text-text-muted">
                        {formatDateTime(order.createdAt)} - {order.itemCount} item
                      </p>
                      <p className="ts-sm font-semibold text-text-strong">
                        {formatRp(Number(order.grandTotal))}
                      </p>
                    </section>
                    <section className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        label={ORDER_STATUS_LABELS[order.status]}
                        tone={ORDER_STATUS_TONES[order.status]}
                      />
                      {order.prescriptionRequired ? (
                        <StatusBadge label="Perlu Resep" tone="warning" />
                      ) : null}
                    </section>
                  </article>
                ))}
              </section>
            ) : ordersQuery.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <EmptyState
                description="Belum ada pesanan yang terhubung dengan akun Anda."
                title="Belum Ada Pesanan"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <section className="flex items-start gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-warning-bg text-warning">
                <PackageSearch aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <CardTitle>Riwayat Resep</CardTitle>
                <p className="ts-sm text-text-muted">
                  Status resep, catatan aman terakhir dari Apoteker, dan
                  hubungan ke pesanan.
                </p>
              </section>
            </section>
          </CardHeader>
          <CardContent>
            {prescriptionsQuery.isError ? (
              <ErrorState
                description="Riwayat resep gagal dimuat."
                onRetry={() => prescriptionsQuery.refetch()}
                title="Resep Tidak Tersedia"
              />
            ) : prescriptionsQuery.data?.data.length ? (
              <section className="grid gap-3">
                {prescriptionsQuery.data.data.map((prescription) => (
                  <article
                    className="grid gap-2 rounded-lg border border-border-default p-4"
                    key={prescription.id}
                  >
                    <section className="flex flex-wrap items-center justify-between gap-2">
                      <section>
                        <p className="ts-sm font-semibold text-text-strong">
                          {prescription.originalFileName}
                        </p>
                        <p className="ts-xs text-text-muted">
                          Pesanan {prescription.order.orderNumber} -{" "}
                          {formatDateTime(prescription.submittedAt)}
                        </p>
                      </section>
                      <StatusBadge
                        label={PRESCRIPTION_STATUS_LABELS[prescription.status]}
                        tone={PRESCRIPTION_STATUS_TONES[prescription.status]}
                      />
                    </section>
                    {prescription.latestNote ? (
                      <p className="ts-sm rounded-lg bg-muted-surface p-3 text-text-default">
                        {prescription.latestNote}
                      </p>
                    ) : null}
                  </article>
                ))}
              </section>
            ) : prescriptionsQuery.isLoading ? (
              <Skeleton className="h-24" />
            ) : (
              <EmptyState
                description="Belum ada resep yang diunggah dari akun Anda."
                title="Belum Ada Resep"
              />
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
