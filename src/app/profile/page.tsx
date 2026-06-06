"use client";

import {
  Building2,
  ClipboardCheck,
  Clock3,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
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
import { APP_META_DESCRIPTION, APP_NAME, APP_ORG_NAME } from "@/constants/app";
import { PICKUP_LOCATION } from "@/constants/pickup";
import { ROUTES } from "@/constants/routes";

const PROFILE_ITEMS = [
  {
    description:
      "Makmur Farma mendukung katalog obat, checkout online, verifikasi resep, dan pengambilan pesanan di klinik.",
    icon: Building2,
    title: "Sistem Farmasi Klinik",
  },
  {
    description:
      "Obat yang membutuhkan resep tidak diproses sampai dokumen ditinjau oleh petugas berwenang.",
    icon: ClipboardCheck,
    title: "Verifikasi Resep",
  },
  {
    description:
      "Stok dikelola berbasis batch dan setiap perubahan dicatat sebagai pergerakan stok.",
    icon: ShieldCheck,
    title: "Stok Tertelusur",
  },
] as const;

const FLOW_ITEMS = [
  "Pelanggan mengecek ketersediaan obat di katalog.",
  "Obat ditambahkan ke keranjang dan dilanjutkan ke checkout.",
  "Resep diunggah bila obat memerlukan verifikasi.",
  "Pesanan diproses setelah pembayaran dan persyaratan resep terpenuhi.",
  "Pesanan diambil di Klinik Makmur Jaya sesuai status sistem.",
] as const;

/**
 * Public clinic profile page for the customer storefront.
 */
export default function ClinicProfilePage() {
  return (
    <>
      <Helmet>
        <title>Profil Klinik | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <CustomerNavbar />

      <main className="min-h-screen bg-page-background">
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-12">
          <section className="grid gap-5">
            <Badge tone="primary" showDot>
              Profil Klinik
            </Badge>
            <section className="grid gap-3">
              <h1 className="ts-4xl text-text-strong">{APP_ORG_NAME}</h1>
              <p className="ts-base max-w-2xl text-text-default">
                {APP_NAME} adalah layanan e-commerce dan manajemen farmasi untuk
                membantu pelanggan melihat stok obat, membuat pesanan, mengunggah
                resep, dan mengambil obat di Klinik Makmur Jaya.
              </p>
            </section>
            <section className="flex flex-wrap gap-3">
              <ButtonLink href={ROUTES.CATALOG.INDEX}>Jelajahi Obat</ButtonLink>
              <ButtonLink href="#alur-layanan" variant="secondary">
                Lihat Alur Layanan
              </ButtonLink>
            </section>
          </section>

          <Card className="overflow-hidden">
            <section className="grid min-h-72 place-items-center bg-muted-surface p-8">
              <section className="grid max-w-sm justify-items-center gap-5 text-center">
                <img
                  alt="Makmur Farma"
                  className="h-16 w-auto"
                  src="/logotype_horizontal.svg"
                />
                <section className="grid gap-2">
                  <p className="ts-lg font-semibold text-text-strong">
                    Farmasi Klinik Terintegrasi
                  </p>
                  <p className="ts-sm text-text-muted">
                    Informasi obat, resep, stok, pembayaran, dan pickup dikelola
                    dalam satu alur yang tertelusur.
                  </p>
                </section>
              </section>
            </section>
          </Card>
        </section>

        <section className="border-y border-border-default bg-card-surface">
          <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-3 md:px-6">
            <section className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-blue-soft text-primary-blue">
                <MapPin aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <h2 className="ts-sm font-semibold text-text-strong">Lokasi</h2>
                <p className="ts-sm text-text-muted">
                  {PICKUP_LOCATION.name}, {PICKUP_LOCATION.address}
                </p>
              </section>
            </section>
            <section className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-info-bg text-info">
                <Clock3 aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <h2 className="ts-sm font-semibold text-text-strong">
                  Status Layanan
                </h2>
                <p className="ts-sm text-text-muted">
                  Pickup aktif untuk pesanan yang sudah siap diambil.
                </p>
              </section>
            </section>
            <section className="flex gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-success-bg text-success">
                <PackageCheck aria-hidden="true" className="size-5" />
              </span>
              <section className="grid gap-1">
                <h2 className="ts-sm font-semibold text-text-strong">
                  Pengambilan Pesanan
                </h2>
                <p className="ts-sm text-text-muted">
                  Ikuti status pesanan dari akun pelanggan sebelum datang ke klinik.
                </p>
              </section>
            </section>
          </section>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 md:px-6">
          <section className="grid gap-1">
            <h2 className="ts-2xl text-text-strong">Layanan Makmur Farma</h2>
            <p className="ts-sm text-text-muted">
              Layanan berfokus pada pembelian obat yang aman, tertelusur, dan mudah
              dipantau pelanggan.
            </p>
          </section>
          <section className="grid gap-4 md:grid-cols-3">
            {PROFILE_ITEMS.map((item) => {
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
          id="alur-layanan"
        >
          <Card>
            <CardHeader>
              <span className="grid size-10 place-items-center rounded-lg bg-primary-blue-soft text-primary-blue">
                <Stethoscope aria-hidden="true" className="size-5" />
              </span>
              <CardTitle>Keamanan Resep</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="ts-sm text-text-muted">
                Sistem tidak menggantikan keputusan tenaga kesehatan. Obat dengan
                penanda resep memerlukan dokumen resep dan verifikasi sebelum
                pesanan dapat diproses.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alur Layanan Pelanggan</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-3 ts-sm text-text-default">
                {FLOW_ITEMS.map((item, index) => (
                  <li className="flex gap-3" key={item}>
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-blue-soft text-primary-blue ts-xs font-semibold">
                      {index + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        <footer className="border-t border-border-default bg-card-surface">
          <section className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-6">
            <p className="ts-sm text-text-muted">
              {APP_NAME} - {APP_ORG_NAME}
            </p>
            <ButtonLink href={ROUTES.CATALOG.INDEX} size="sm">
              Jelajahi Obat
            </ButtonLink>
          </section>
        </footer>
      </main>
    </>
  );
}
