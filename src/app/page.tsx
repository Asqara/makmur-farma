"use client";

import {
  ClipboardCheck,
  MapPin,
  PackageCheck,
  Pill,
  ShoppingCart,
  Stethoscope,
} from "lucide-react";
import Link from "next/link";
import { Helmet } from "react-helmet-async";

import {
  Badge,
  ButtonLink,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CustomerNavbar,
} from "@/components/ui";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { PICKUP_LOCATION } from "@/constants/pickup";
import { ROUTES } from "@/constants/routes";

const SERVICE_ITEMS = [
  {
    description: "Katalog obat klinik dengan status stok dan penanda resep.",
    icon: Pill,
    title: "Katalog Obat",
  },
  {
    description: "Pembelian online dengan keranjang, checkout, dan status pesanan.",
    icon: ShoppingCart,
    title: "Belanja Online",
  },
  {
    description: "Alur verifikasi resep oleh Apoteker sebelum pesanan diproses.",
    icon: ClipboardCheck,
    title: "Verifikasi Resep",
  },
  {
    description: "Pengambilan pesanan di Klinik Makmur Jaya sesuai instruksi sistem.",
    icon: PackageCheck,
    title: "Pickup Klinik",
  },
] as const;

const CATEGORY_ITEMS = [
  "Obat bebas",
  "Vitamin",
  "Perawatan kesehatan",
  "Obat dengan resep",
] as const;

/**
 * Public landing page for Makmur Farma.
 */
export default function HomePage() {
  return (
    <>
      <Helmet>
        <title>Makmur Farma | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <CustomerNavbar />

      <main className="min-h-screen bg-page-background">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:grid-cols-[1.05fr_0.95fr] md:items-center md:px-6 lg:py-12">
          <section className="grid gap-6">
            <section className="grid gap-3">
              <Badge tone="primary" showDot>
                Klinik Makmur Jaya
              </Badge>
              <h1 className="ts-4xl text-text-strong">Makmur Farma</h1>
              <p className="ts-base max-w-2xl text-text-default">
                Sistem e-commerce dan manajemen farmasi Klinik Makmur Jaya untuk
                melihat ketersediaan obat, membuat pesanan, mengunggah resep, dan
                mengambil pesanan di lokasi klinik.
              </p>
            </section>
            <section className="flex flex-wrap gap-3">
              <ButtonLink href={ROUTES.CATALOG.INDEX}>
                Jelajahi Obat
              </ButtonLink>
              <ButtonLink href="#cara-belanja" variant="secondary">
                Cara Belanja
              </ButtonLink>
            </section>
          </section>

          <section className="overflow-hidden rounded-[10px] border border-border-default bg-card-surface shadow-card">
            <section className="grid aspect-4/3 place-items-center bg-muted-surface p-8">
              <section className="grid max-w-sm gap-4 text-center">
                <img
                  alt="Makmur Farma"
                  className="mx-auto h-16 w-auto"
                  src="/logotype_horizontal.svg"
                />
                <section className="grid grid-cols-2 gap-3">
                  {CATEGORY_ITEMS.map((category) => (
                    <span
                      className="rounded-lg border border-border-default bg-card-surface px-3 py-2 ts-sm font-medium text-text-default"
                      key={category}
                    >
                      {category}
                    </span>
                  ))}
                </section>
              </section>
            </section>
          </section>
        </section>

        <section className="border-y border-border-default bg-card-surface">
          <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:grid-cols-3 md:px-6">
            <section className="grid gap-2" id="profil-klinik">
              <span className="grid size-10 place-items-center rounded-lg bg-primary-blue-soft text-primary-blue">
                <Stethoscope aria-hidden="true" className="size-5" />
              </span>
              <h2 className="ts-lg font-semibold text-text-strong">
                Profil Klinik
              </h2>
              <p className="ts-sm text-text-muted">
                Klinik Makmur Jaya menyediakan layanan farmasi untuk kebutuhan
                pasien dan pelanggan dengan proses yang terdokumentasi.
              </p>
            </section>
            <section className="grid gap-2">
              <span className="grid size-10 place-items-center rounded-lg bg-info-bg text-info">
                <ClipboardCheck aria-hidden="true" className="size-5" />
              </span>
              <h2 className="ts-lg font-semibold text-text-strong">
                Resep Tetap Diverifikasi
              </h2>
              <p className="ts-sm text-text-muted">
                Obat yang memerlukan resep akan diproses setelah dokumen resep
                ditinjau oleh petugas berwenang.
              </p>
            </section>
            <section className="grid gap-2">
              <span className="grid size-10 place-items-center rounded-lg bg-success-bg text-success">
                <MapPin aria-hidden="true" className="size-5" />
              </span>
              <h2 className="ts-lg font-semibold text-text-strong">
                Lokasi Pickup
              </h2>
              <p className="ts-sm text-text-muted">
                {PICKUP_LOCATION.name}, {PICKUP_LOCATION.address}.
              </p>
            </section>
          </section>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6">
          <section className="grid gap-1">
            <h2 className="ts-2xl text-text-strong">Layanan Farmasi</h2>
            <p className="ts-sm text-text-muted">
              Alur dibuat ringkas untuk belanja obat online dan pengambilan di
              klinik.
            </p>
          </section>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_ITEMS.map((item) => {
              const Icon = item.icon;

              return (
                <Card key={item.title}>
                  <CardHeader>
                    <span className="grid size-10 place-items-center rounded-lg bg-primary-blue-soft text-primary-blue">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="ts-sm text-text-muted">{item.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </section>

        <section
          className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 md:grid-cols-[0.9fr_1.1fr] md:px-6"
          id="cara-belanja"
        >
          <Card>
            <CardHeader>
              <CardTitle>Cara Pembelian Online</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 ts-sm text-text-default">
                <li>1. Buka katalog dan pilih obat yang tersedia.</li>
                <li>2. Tambahkan obat ke keranjang.</li>
                <li>3. Masuk atau daftar saat checkout.</li>
                <li>4. Unggah resep bila obat memerlukannya.</li>
                <li>5. Ikuti status pembayaran dan pengambilan pesanan.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mulai dari Katalog</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="ts-sm text-text-muted">
                Katalog menampilkan obat aktif, kategori, harga, stok tersedia,
                serta label obat bebas atau perlu resep.
              </p>
              <section className="flex flex-wrap gap-3">
                <ButtonLink href={ROUTES.CATALOG.INDEX}>
                  Lihat Katalog
                </ButtonLink>
                <ButtonLink href={ROUTES.CART} variant="secondary">
                  Buka Keranjang
                </ButtonLink>
              </section>
            </CardContent>
          </Card>
        </section>

        <footer className="border-t border-border-default bg-card-surface">
          <section className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-6">
            <p className="ts-sm text-text-muted">
              Makmur Farma - Klinik Makmur Jaya
            </p>
            <Link
              className="ts-sm text-primary-blue hover:text-primary-blue-hover"
              href={ROUTES.CATALOG.INDEX}
            >
              Jelajahi Obat
            </Link>
          </section>
        </footer>
      </main>
    </>
  );
}
