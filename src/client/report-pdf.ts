import { and, desc, eq, gte, lte, ne, type SQL } from "drizzle-orm";

import { APP_NAME, APP_ORG_NAME } from "@/constants/app";
import { orders, payments } from "@/drizzle-schema";
import { readDb } from "@/lib/db";

type ReportRow = {
  createdAt: Date;
  grandTotal: string;
  orderNumber: string;
  paymentMethod: string;
  status: string;
};

export type ReportPdfSnapshot = {
  averageOrderValue: number;
  filters: {
    from: string | null;
    to: string | null;
  };
  generatedAt: Date;
  paymentBreakdown: Array<{
    amount: number;
    count: number;
    method: string;
  }>;
  rows: ReportRow[];
  title: string;
  totalRevenue: number;
  transactionCount: number;
  type: string;
};

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN_X = 36;
const TABLE_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
const HEADER_BLUE = "2563EB";
const BLUE_SOFT = "EAF0FF";
const BORDER = "D7DCE8";
const TEXT_STRONG = "17202E";
const TEXT_MUTED = "637083";
const SUCCESS = "0F9F6E";
const TABLE_COLUMNS = {
  date: MARGIN_X + 192,
  method: MARGIN_X + 346,
  no: MARGIN_X + 10,
  order: MARGIN_X + 44,
  status: MARGIN_X + 476,
  total: MARGIN_X + 642,
} as const;

function reportTitle(type: string) {
  if (type === "TRANSACTION_SUMMARY") return "Ringkasan Transaksi";
  if (type === "SALES") return "Laporan Penjualan";

  return type
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parseDateBound(value: string | null, endOfDay = false) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

function toFilterText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function formatDate(value: Date | string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function formatRp(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatPaymentMethod(value: string) {
  const labels: Record<string, string> = {
    BANK_TRANSFER: "Transfer Bank",
    CASH: "Tunai",
    QRIS: "QRIS",
  };

  return labels[value] ?? reportTitle(value);
}

function formatOrderStatus(value: string) {
  const labels: Record<string, string> = {
    AWAITING_PAYMENT: "Menunggu Bayar",
    AWAITING_PRESCRIPTION: "Menunggu Resep",
    CANCELLED: "Dibatalkan",
    COMPLETED: "Selesai",
    EXPIRED: "Kedaluwarsa",
    PAID: "Dibayar",
    PAYMENT_PENDING: "Menunggu Bayar",
    PRESCRIPTION_REJECTED: "Resep Ditolak",
    PRESCRIPTION_REVIEW: "Review Resep",
    PROCESSING: "Diproses",
    READY_FOR_PICKUP: "Siap Diambil",
    REFUNDED: "Dikembalikan",
    SHIPPED: "Dikirim",
  };

  return labels[value] ?? reportTitle(value);
}

function escapePdfText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r?\n/g, " ");
}

function truncate(value: string, maxLength: number) {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}.` : value;
}

function rgb(hex: string) {
  const value = hex.replace("#", "");
  const r = Number.parseInt(value.slice(0, 2), 16) / 255;
  const g = Number.parseInt(value.slice(2, 4), 16) / 255;
  const b = Number.parseInt(value.slice(4, 6), 16) / 255;

  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

class PdfPage {
  private commands: string[] = [];

  fill(hex: string) {
    this.commands.push(`${rgb(hex)} rg`);
  }

  stroke(hex: string) {
    this.commands.push(`${rgb(hex)} RG`);
  }

  rect(x: number, yTop: number, width: number, height: number, fill = true) {
    const y = PAGE_HEIGHT - yTop - height;
    this.commands.push(
      `${x.toFixed(1)} ${y.toFixed(1)} ${width.toFixed(1)} ${height.toFixed(1)} re ${fill ? "f" : "S"}`,
    );
  }

  line(x1: number, y1Top: number, x2: number, y2Top: number) {
    const y1 = PAGE_HEIGHT - y1Top;
    const y2 = PAGE_HEIGHT - y2Top;
    this.commands.push(
      `${x1.toFixed(1)} ${y1.toFixed(1)} m ${x2.toFixed(1)} ${y2.toFixed(1)} l S`,
    );
  }

  text(
    value: string,
    x: number,
    yTop: number,
    options: {
      color?: string;
      font?: "bold" | "regular";
      size?: number;
    } = {},
  ) {
    const y = PAGE_HEIGHT - yTop;
    const font = options.font === "bold" ? "F2" : "F1";
    const size = options.size ?? 10;
    this.commands.push(
      "BT",
      `${rgb(options.color ?? TEXT_STRONG)} rg`,
      `/${font} ${size} Tf`,
      `${x.toFixed(1)} ${y.toFixed(1)} Td`,
      `(${escapePdfText(value)}) Tj`,
      "ET",
    );
  }

  content() {
    return this.commands.join("\n");
  }
}

function addHeader(page: PdfPage, snapshot: ReportPdfSnapshot) {
  page.fill(HEADER_BLUE);
  page.rect(0, 0, PAGE_WIDTH, 78);
  page.fill("FFFFFF");
  page.rect(MARGIN_X, 22, 24, 24);
  page.text("MF", MARGIN_X + 4, 39, {
    color: HEADER_BLUE,
    font: "bold",
    size: 9,
  });
  page.text(APP_NAME, MARGIN_X + 34, 32, {
    color: "FFFFFF",
    font: "bold",
    size: 18,
  });
  page.text(APP_ORG_NAME, MARGIN_X + 34, 52, {
    color: "DBEAFE",
    size: 10,
  });
  page.text(snapshot.title, MARGIN_X, 69, {
    color: "FFFFFF",
    font: "bold",
    size: 12,
  });
  page.text(`Dibuat ${formatDateTime(snapshot.generatedAt)}`, 610, 34, {
    color: "DBEAFE",
    size: 9,
  });
  page.text(
    `Periode ${formatDate(snapshot.filters.from)} sampai ${formatDate(snapshot.filters.to)}`,
    610,
    54,
    { color: "FFFFFF", size: 9 },
  );
}

function addSummaryCard(
  page: PdfPage,
  x: number,
  title: string,
  value: string,
  helper: string,
) {
  const width = 190;
  page.fill("FFFFFF");
  page.rect(x, 104, width, 76);
  page.stroke(BORDER);
  page.rect(x, 104, width, 76, false);
  page.text(title, x + 14, 130, { color: TEXT_MUTED, size: 9 });
  page.text(value, x + 14, 154, { color: TEXT_STRONG, font: "bold", size: 16 });
  page.text(helper, x + 14, 172, { color: TEXT_MUTED, size: 8 });
}

function addOverview(page: PdfPage, snapshot: ReportPdfSnapshot) {
  addSummaryCard(
    page,
    MARGIN_X,
    "Total Pendapatan",
    formatRp(snapshot.totalRevenue),
    "Hanya pembayaran PAID",
  );
  addSummaryCard(
    page,
    MARGIN_X + 214,
    "Transaksi Dibayar",
    `${snapshot.transactionCount}`,
    "Order batal/refund tidak dihitung",
  );
  addSummaryCard(
    page,
    MARGIN_X + 428,
    "Rata-rata Order",
    formatRp(snapshot.averageOrderValue),
    "Pendapatan / transaksi",
  );
}

function addPaymentBreakdown(page: PdfPage, snapshot: ReportPdfSnapshot) {
  const top = 226;
  page.text("Ringkasan Metode Pembayaran", MARGIN_X, top, {
    font: "bold",
    size: 12,
  });
  page.text(
    "Distribusi nominal transaksi berdasarkan metode pembayaran.",
    MARGIN_X,
    top + 18,
    { color: TEXT_MUTED, size: 9 },
  );

  const maxAmount = Math.max(
    1,
    ...snapshot.paymentBreakdown.map((item) => item.amount),
  );
  let y = top + 38;

  if (snapshot.paymentBreakdown.length === 0) {
    page.fill(BLUE_SOFT);
    page.rect(MARGIN_X, y, TABLE_WIDTH, 42);
    page.text("Tidak ada transaksi dibayar pada periode ini.", MARGIN_X + 14, y + 26, {
      color: TEXT_MUTED,
      size: 10,
    });
    return;
  }

  snapshot.paymentBreakdown.forEach((item) => {
    const barWidth = Math.max(8, (item.amount / maxAmount) * 390);
    page.text(formatPaymentMethod(item.method), MARGIN_X, y + 14, {
      font: "bold",
      size: 9,
    });
    page.fill(BLUE_SOFT);
    page.rect(MARGIN_X + 142, y, 400, 16);
    page.fill(HEADER_BLUE);
    page.rect(MARGIN_X + 142, y, barWidth, 16);
    page.text(`${item.count} trx`, MARGIN_X + 566, y + 12, {
      color: TEXT_MUTED,
      size: 8,
    });
    page.text(formatRp(item.amount), MARGIN_X + 632, y + 12, {
      color: TEXT_STRONG,
      font: "bold",
      size: 8,
    });
    y += 26;
  });
}

function addTableHeader(page: PdfPage, y: number) {
  page.fill(BLUE_SOFT);
  page.rect(MARGIN_X, y, TABLE_WIDTH, 26);
  page.text("No", TABLE_COLUMNS.no, y + 17, { color: TEXT_MUTED, font: "bold", size: 8 });
  page.text("Order", TABLE_COLUMNS.order, y + 17, { color: TEXT_MUTED, font: "bold", size: 8 });
  page.text("Tanggal", TABLE_COLUMNS.date, y + 17, { color: TEXT_MUTED, font: "bold", size: 8 });
  page.text("Metode", TABLE_COLUMNS.method, y + 17, { color: TEXT_MUTED, font: "bold", size: 8 });
  page.text("Status", TABLE_COLUMNS.status, y + 17, { color: TEXT_MUTED, font: "bold", size: 8 });
  page.text("Total", TABLE_COLUMNS.total, y + 17, { color: TEXT_MUTED, font: "bold", size: 8 });
}

function addFooter(page: PdfPage, pageNumber: number, totalPages: number) {
  page.stroke(BORDER);
  page.line(MARGIN_X, 558, PAGE_WIDTH - MARGIN_X, 558);
  page.text("Laporan dibuat ulang di memori saat download. File PDF tidak disimpan permanen.", MARGIN_X, 576, {
    color: TEXT_MUTED,
    size: 8,
  });
  page.text(`Halaman ${pageNumber} dari ${totalPages}`, 730, 576, {
    color: TEXT_MUTED,
    size: 8,
  });
}

function createPages(snapshot: ReportPdfSnapshot) {
  const firstPage = new PdfPage();
  addHeader(firstPage, snapshot);
  addOverview(firstPage, snapshot);
  addPaymentBreakdown(firstPage, snapshot);
  firstPage.text("Daftar Transaksi", MARGIN_X, 332, {
    font: "bold",
    size: 12,
  });

  const pages = [firstPage];
  let page = firstPage;
  let y = 348;
  let rowOnPage = 0;
  addTableHeader(page, y);
  y += 31;

  if (snapshot.rows.length === 0) {
    page.fill("FFFFFF");
    page.rect(MARGIN_X, y, TABLE_WIDTH, 42);
    page.stroke(BORDER);
    page.rect(MARGIN_X, y, TABLE_WIDTH, 42, false);
    page.text("Tidak ada transaksi dibayar pada periode ini.", MARGIN_X + 14, y + 27, {
      color: TEXT_MUTED,
      size: 10,
    });
  }

  snapshot.rows.forEach((row, index) => {
    if (y > 524) {
      page = new PdfPage();
      pages.push(page);
      addHeader(page, snapshot);
      page.text("Daftar Transaksi", MARGIN_X, 112, { font: "bold", size: 12 });
      y = 130;
      addTableHeader(page, y);
      y += 31;
      rowOnPage = 0;
    }

    if (rowOnPage % 2 === 0) {
      page.fill("F8F9FC");
      page.rect(MARGIN_X, y - 17, TABLE_WIDTH, 24);
    }

    page.text(String(index + 1), TABLE_COLUMNS.no, y, { color: TEXT_MUTED, size: 8 });
    page.text(truncate(row.orderNumber, 24), TABLE_COLUMNS.order, y, {
      font: "bold",
      size: 8,
    });
    page.text(formatDateTime(row.createdAt), TABLE_COLUMNS.date, y, {
      color: TEXT_MUTED,
      size: 8,
    });
    page.text(formatPaymentMethod(row.paymentMethod), TABLE_COLUMNS.method, y, {
      color: TEXT_MUTED,
      size: 8,
    });
    page.text(formatOrderStatus(row.status), TABLE_COLUMNS.status, y, {
      color: SUCCESS,
      font: "bold",
      size: 8,
    });
    page.text(formatRp(Number(row.grandTotal)), TABLE_COLUMNS.total, y, {
      font: "bold",
      size: 8,
    });

    y += 24;
    rowOnPage += 1;
  });

  pages.forEach((item, index) => addFooter(item, index + 1, pages.length));

  return pages;
}

function buildPdfDocument(pageContents: string[]) {
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "PAGES_PLACEHOLDER",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  const pageObjectNumbers: number[] = [];

  pageContents.forEach((content) => {
    const pageObjectNumber = objects.length + 1;
    const contentObjectNumber = pageObjectNumber + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  });

  objects[1] =
    `<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  let body = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(body));
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length + 1}\n`;
  body += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    body += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body);
}

/**
 * Builds a report snapshot from authoritative paid order data.
 */
export async function buildReportPdfSnapshot(
  type: string,
  filters: Record<string, unknown>,
): Promise<ReportPdfSnapshot> {
  const from = toFilterText(filters.from);
  const to = toFilterText(filters.to);
  const conditions: SQL<unknown>[] = [
    eq(payments.status, "PAID"),
    ne(orders.status, "CANCELLED"),
    ne(orders.status, "EXPIRED"),
    ne(orders.status, "REFUNDED"),
  ];
  const fromDate = parseDateBound(from);
  const toDate = parseDateBound(to, true);

  if (fromDate) conditions.push(gte(orders.createdAt, fromDate));
  if (toDate) conditions.push(lte(orders.createdAt, toDate));

  const rows = await readDb
    .select({
      createdAt: orders.createdAt,
      grandTotal: orders.grandTotal,
      orderNumber: orders.orderNumber,
      paymentMethod: payments.method,
      status: orders.status,
    })
    .from(orders)
    .innerJoin(payments, eq(payments.orderId, orders.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(200);

  const totalRevenue = rows.reduce(
    (sum, row) => sum + Number(row.grandTotal),
    0,
  );
  const byPaymentMethod = new Map<string, { amount: number; count: number }>();

  rows.forEach((row) => {
    const existing = byPaymentMethod.get(row.paymentMethod) ?? {
      amount: 0,
      count: 0,
    };
    existing.amount += Number(row.grandTotal);
    existing.count += 1;
    byPaymentMethod.set(row.paymentMethod, existing);
  });

  return {
    averageOrderValue: rows.length ? totalRevenue / rows.length : 0,
    filters: { from, to },
    generatedAt: new Date(),
    paymentBreakdown: [...byPaymentMethod.entries()]
      .map(([method, value]) => ({
        amount: value.amount,
        count: value.count,
        method,
      }))
      .sort((left, right) => right.amount - left.amount),
    rows,
    title: reportTitle(type),
    totalRevenue,
    transactionCount: rows.length,
    type,
  };
}

/**
 * Renders a polished PDF into memory. The returned bytes are not persisted.
 */
export function renderReportPdf(snapshot: ReportPdfSnapshot) {
  return buildPdfDocument(createPages(snapshot).map((page) => page.content()));
}

/**
 * Builds report bytes from current database state without persisting the file.
 */
export async function generateReportPdf(
  type: string,
  filters: Record<string, unknown>,
) {
  const snapshot = await buildReportPdfSnapshot(type, filters);
  const bytes = renderReportPdf(snapshot);

  return { bytes, snapshot };
}
