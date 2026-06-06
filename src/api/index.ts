import { Elysia } from "elysia";
import { openapi } from "@elysia/openapi";

import { internalApi } from "./__internal__";
import { notificationsApi } from "./notifications";
import { v1Api } from "./v1";
import { ENV } from "@/constants/config";
import { AppError } from "@/lib/errors";

function isPublicApiError(
  error: unknown,
): error is { code: string; publicMessage: string; statusCode: number } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "publicMessage" in error &&
    "statusCode" in error &&
    typeof (error as { code: unknown }).code === "string" &&
    typeof (error as { publicMessage: unknown }).publicMessage === "string" &&
    typeof (error as { statusCode: unknown }).statusCode === "number"
  );
}

/**
 * Makmur Farma Elysia API mounted by the Next.js catch-all route.
 */
export const app = new Elysia()
  .use(
    openapi({
      documentation: {
        info: {
          contact: {
            name: "Klinik Makmur Jaya",
          },
          description:
            "API Makmur Farma untuk autentikasi, katalog, transaksi, farmasi, inventori, laporan, import, monitoring, dan notifikasi.",
          title: "Makmur Farma API",
          version: "1.0.0",
        },
        servers: [
          {
            description: "Aplikasi lokal/demo",
            url: ENV.appPublicUrl,
          },
        ],
        tags: [
          { name: "Authentication", description: "Registrasi, login, session, dan logout." },
          { name: "Users", description: "Pengguna dan pelanggan." },
          { name: "Medicines", description: "Master obat dan katalog." },
          { name: "Categories", description: "Kategori obat." },
          { name: "Suppliers", description: "Supplier obat." },
          { name: "Inventory", description: "Batch, stok, dan penyesuaian." },
          { name: "Stock Movements", description: "Riwayat movement stok." },
          { name: "Prescriptions", description: "Pengajuan dan verifikasi resep." },
          { name: "Carts", description: "Keranjang dan checkout pelanggan." },
          { name: "Orders", description: "Pesanan online dan kasir." },
          { name: "Payments", description: "Pembayaran dan simulator QRIS." },
          { name: "Cashier", description: "Transaksi kasir counter." },
          { name: "Notifications", description: "Notifikasi aplikasi." },
          { name: "Reports", description: "Laporan dan riwayat report." },
          { name: "Imports", description: "Import data obat dan stok." },
          { name: "Jobs", description: "Background job dan antrean." },
          { name: "Monitoring", description: "Health check sistem." },
          { name: "Errors", description: "Application error log." },
        ],
      },
      enabled: ENV.enableApiDocs,
      exclude: {
        paths: ["/api/__internal__/*"],
        staticFile: true,
      },
      path: "/api/v1/docs",
      provider: "scalar",
      // Override spec URL to absolute path — the library strips the leading "/"
      // producing a relative URL that resolves incorrectly in the browser.
      scalar: {
        url: "/api/v1/docs/json",
      },
      specPath: "/api/v1/docs/json",
    }),
  )
  .onError(({ error, set }) => {
    if (error instanceof AppError) {
      set.status = error.statusCode;

      return {
        code: error.code,
        message: error.publicMessage,
      };
    }

    if (isPublicApiError(error)) {
      set.status = error.statusCode;

      return {
        code: error.code,
        message: error.publicMessage,
      };
    }

    console.error("Unhandled API error.", error);
    set.status = 500;

    return {
      code: "INTERNAL_SERVER_ERROR",
      message: "Terjadi kesalahan pada server.",
    };
  })
  .use(internalApi)
  .use(v1Api)
  .use(notificationsApi);

export type App = typeof app;
