"use client";

import { ShieldCheck, UserRound } from "lucide-react";
import { Helmet } from "react-helmet-async";

import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/constants/auth";
import { useAuth } from "@/hooks/useAuth";

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Minimal protected operational dashboard.
 */
export default function DashboardPage() {
  const auth = useAuth();
  const user = auth.data?.user;
  const session = auth.data?.session;

  if (!user || !session) {
    return (
      <section className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </section>
    );
  }

  return (
    <section className="grid gap-6">
      <Helmet>
        <title>Dashboard | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <Card>
        <CardHeader>
          <section className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-lg bg-primary-blue-soft text-primary-blue">
              <UserRound aria-hidden="true" className="size-5" />
            </span>
            <section className="grid gap-1">
              <CardTitle>Selamat Datang, {user.name}</CardTitle>
              <p className="ts-sm text-text-muted">
                Anda masuk sebagai {USER_ROLE_LABELS[user.role]}.
              </p>
            </section>
          </section>
          <Badge tone="success" showDot>
            Session aktif
          </Badge>
        </CardHeader>
        <CardContent>
          <p className="ts-sm text-text-default">
            Halaman ini mengonfirmasi autentikasi, role, dan session aktif.
            Modul bisnis lain akan menggunakan identitas server-side yang sama.
          </p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Role</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Badge tone="primary">{USER_ROLE_LABELS[user.role]}</Badge>
            <p className="ts-xs text-text-muted">
              Role dibaca dari session server, bukan dari input client.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status Akun</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Badge tone={user.status === "ACTIVE" ? "success" : "warning"}>
              {USER_STATUS_LABELS[user.status]}
            </Badge>
            <p className="ts-xs text-text-muted">
              Email diverifikasi: {formatDateTime(user.emailVerifiedAt)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <section className="flex items-center gap-2 text-success">
              <ShieldCheck aria-hidden="true" className="size-4" />
              <span className="ts-sm font-medium">Cookie HTTP-only</span>
            </section>
            <p className="ts-xs text-text-muted">
              Berakhir: {formatDateTime(session.absoluteExpiresAt)}
            </p>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
