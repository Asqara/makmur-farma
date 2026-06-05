"use client";

import { ArrowLeft, SearchX } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";

/**
 * Global 404 not found page.
 */
export default function NotFoundPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-page-background px-6 py-24">
      <section className="grid max-w-md gap-6 text-center">
        <section className="flex justify-center">
          <section className="grid size-16 place-items-center rounded-xl bg-muted-surface">
            <SearchX aria-hidden="true" className="size-8 text-text-muted" />
          </section>
        </section>
        <section className="grid gap-3">
          <h1 className="ts-3xl font-bold text-text-strong">Halaman Tidak Ditemukan</h1>
          <p className="ts-sm text-text-muted">
            Halaman yang kamu cari tidak ada atau sudah dipindahkan.
            Periksa kembali URL atau kembali ke dashboard.
          </p>
        </section>
        <section className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary-blue px-4 ts-sm font-medium text-white transition-colors hover:bg-primary-blue/90"
            href={ROUTES.DASHBOARD}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Kembali ke Dashboard
          </Link>
        </section>
        <p className="ts-mono-xs text-text-disabled">404 Not Found</p>
      </section>
    </main>
  );
}
