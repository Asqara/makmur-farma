"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  Bug,
  ClipboardCheck,
  ExternalLink,
  PackageSearch,
  ReceiptText,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { useMemo, useState } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DashboardMetricCard,
  DataTable,
  DateInput,
  EmptyState,
  ErrorState,
  OrderStatusBadge,
  Skeleton,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import {
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/constants/domain";
import { useAuth } from "@/hooks/useAuth";
import { eden } from "@/lib/eden";
import { formatRp } from "@/utils/formatRp";
import { formatDateTime } from "@/utils/inventoryDisplay";

type DashboardOverview = {
  dateRange: {
    from: string;
    to: string;
  };
  metrics: Array<{
    key: string;
    title: string;
    tone: "danger" | "info" | "neutral" | "primary" | "success" | "warning";
    value: number | string;
  }>;
  orderStatus: Array<{
    count: number;
    status: OrderStatus;
  }>;
  recent: {
    failedPayments: Array<{
      amount: string;
      createdAt: Date | string;
      id: string;
      orderId: string;
      orderNumber: string;
    }>;
    recentOrders: Array<{
      channel: string;
      createdAt: Date | string;
      grandTotal: string;
      id: string;
      orderNumber: string;
      status: OrderStatus;
    }>;
    systemErrors: Array<{
      createdAt: Date | string;
      id: string;
      safeMessage: string;
      severity: string;
      source: string;
    }>;
  };
  salesTrend: Array<{
    date: string;
    orderCount: number;
    revenue: string;
  }>;
};

const METRIC_ICONS = {
  "counter-orders": <ReceiptText />,
  "critical-stock": <AlertTriangle />,
  "failed-jobs": <Activity />,
  "failed-payments": <AlertTriangle />,
  "low-stock": <PackageSearch />,
  "online-orders": <ShoppingCart />,
  "open-critical-errors": <Bug />,
  "out-stock": <AlertTriangle />,
  orders: <ShoppingCart />,
  prescriptions: <ClipboardCheck />,
  processing: <ReceiptText />,
  revenue: <TrendingUp />,
} as const;

function getDefaultRange() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 29);

  return {
    from: from.toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

type RoleActionPanelProps = {
  count: number;
  description: string;
  href: string;
  label: string;
  title: string;
  tone: "danger" | "info" | "neutral" | "primary" | "success" | "warning";
};

const TONE_CLASSES: Record<RoleActionPanelProps["tone"], string> = {
  danger: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
  neutral: "border-zinc-200 bg-zinc-50 text-zinc-800",
  primary: "border-indigo-200 bg-indigo-50 text-indigo-800",
  success: "border-green-200 bg-green-50 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
};

function RoleActionPanel({
  count,
  description,
  href,
  label,
  title,
  tone,
}: RoleActionPanelProps) {
  return (
    <Card className={`border p-5 ${TONE_CLASSES[tone]}`}>
      <section className="flex items-center justify-between gap-4">
        <section className="grid gap-1">
          <p className="ts-sm font-medium">{title}</p>
          <strong className="ts-3xl">{count}</strong>
          <p className="ts-xs">{description}</p>
        </section>
        <Link
          className="inline-flex items-center gap-1 rounded-md border border-current px-3 py-1.5 ts-sm font-medium hover:opacity-80 transition-opacity"
          href={href}
        >
          {label}
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </Link>
      </section>
    </Card>
  );
}

type StockActionPanelProps = {
  criticalCount: number;
  outCount: number;
};

function StockActionPanel({ criticalCount, outCount }: StockActionPanelProps) {
  if (criticalCount === 0 && outCount === 0) {
    return null;
  }

  return (
    <Card className="border border-red-200 bg-red-50 p-5">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <section className="grid gap-1">
          <p className="ts-sm font-semibold text-red-800">Peringatan Stok</p>
          <p className="ts-sm text-red-700">
            {outCount > 0 && (
              <span>
                <strong>{outCount}</strong> obat stok habis.{" "}
              </span>
            )}
            {criticalCount > 0 && (
              <span>
                <strong>{criticalCount}</strong> obat stok kritis.
              </span>
            )}
          </p>
        </section>
        <Link
          className="inline-flex w-fit items-center gap-1 rounded-md border border-red-400 px-3 py-1.5 ts-sm font-medium text-red-800 hover:opacity-80 transition-opacity"
          href="/batches"
        >
          Kelola Batch
          <ExternalLink aria-hidden="true" className="size-3.5" />
        </Link>
      </section>
    </Card>
  );
}

/**
 * Operational dashboard backed by authoritative database aggregates.
 */
export default function DashboardPage() {
  const [dateRange, setDateRange] = useState(getDefaultRange);
  const authQuery = useAuth();
  const userRole = authQuery.data?.user?.role ?? null;

  const dashboardQuery = useQuery({
    queryFn: async () => {
      const response = await eden.api.v1.dashboard.overview.get({
        query: dateRange,
      });

      if (response.error) throw response.error;

      return response.data as DashboardOverview;
    },
    queryKey: ["dashboard", "overview", dateRange],
  });

  const metricNodes = useMemo(() => {
    const metrics = dashboardQuery.data?.metrics ?? [];

    const METRIC_LINKS: Record<string, string> = {
      "counter-orders": "/orders",
      "critical-stock": "/batches",
      "failed-jobs": "/jobs",
      "failed-payments": "/payments",
      "low-stock": "/batches",
      "online-orders": "/orders",
      "open-critical-errors": "/error-logs",
      "out-stock": "/batches",
      orders: "/orders",
      prescriptions: "/prescriptions",
      processing: "/orders",
    };

    return metrics.map((metric) => {
      const href = METRIC_LINKS[metric.key];
      const card = (
        <DashboardMetricCard
          icon={METRIC_ICONS[metric.key as keyof typeof METRIC_ICONS]}
          key={metric.key}
          title={metric.title}
          tone={metric.tone}
          value={
            metric.key === "revenue"
              ? formatRp(Number(metric.value))
              : metric.value
          }
        />
      );

      if (href) {
        return (
          <Link className="group" href={href} key={metric.key}>
            {card}
          </Link>
        );
      }

      return card;
    });
  }, [dashboardQuery.data]);

  if (dashboardQuery.isLoading) {
    return (
      <section className="grid gap-6">
        <Skeleton className="h-20" />
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton className="h-28" key={index} />
          ))}
        </section>
        <Skeleton className="h-80" />
      </section>
    );
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <ErrorState
        actionLabel="Coba Lagi"
        description="Dashboard gagal dimuat. Periksa koneksi API dan database."
        onRetry={() => dashboardQuery.refetch()}
        title="Dashboard Tidak Tersedia"
      />
    );
  }

  const overview = dashboardQuery.data;

  return (
    <section className="grid gap-6">
      <Helmet>
        <title>Dashboard | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>

      <section className="ssp-filter-bar">
        <DateInput
          id="dashboard-date-range"
          label="Rentang Tanggal"
          mode="range"
          onValueChange={setDateRange}
          value={dateRange}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metricNodes}
      </section>

      {userRole === "PHARMACIST" && (
        <RoleActionPanel
          count={Number(
            overview.metrics.find((m) => m.key === "prescriptions")?.value ?? 0,
          )}
          description="Resep yang menunggu tinjauan farmasis."
          href="/prescriptions"
          label="Tinjau Resep"
          title="Antrian Resep"
          tone="warning"
        />
      )}

      {userRole === "CASHIER" && (
        <RoleActionPanel
          count={Number(
            overview.metrics.find((m) => m.key === "counter-orders")?.value ?? 0,
          )}
          description="Transaksi kasir pada periode ini."
          href="/orders"
          label="Lihat Transaksi"
          title="Transaksi Kasir"
          tone="info"
        />
      )}

      {(userRole === "ADMIN" ||
        userRole === "PHARMACIST") && (
        <StockActionPanel
          criticalCount={Number(
            overview.metrics.find((m) => m.key === "critical-stock")?.value ?? 0,
          )}
          outCount={Number(
            overview.metrics.find((m) => m.key === "out-stock")?.value ?? 0,
          )}
        />
      )}

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Tren Penjualan</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.salesTrend.length ? (
              <section className="h-72">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={overview.salesTrend}>
                    <CartesianGrid stroke="#E7E9F1" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} />
                    <YAxis tickLine={false} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue"
                          ? [formatRp(Number(value)), "Pendapatan"]
                          : [value, "Pesanan"]
                      }
                    />
                    <Area
                      dataKey="revenue"
                      fill="#EAF0FF"
                      name="Pendapatan"
                      stroke="#3366FF"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </section>
            ) : (
              <EmptyState
                description="Belum ada transaksi pada rentang tanggal ini."
                title="Belum Ada Tren"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Status Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.orderStatus.length ? (
              <section className="h-72">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={overview.orderStatus}>
                    <CartesianGrid stroke="#E7E9F1" vertical={false} />
                    <XAxis
                      dataKey="status"
                      tickFormatter={(value: OrderStatus) =>
                        ORDER_STATUS_LABELS[value] ?? value
                      }
                      tickLine={false}
                    />
                    <YAxis tickLine={false} />
                    <Tooltip
                      labelFormatter={(value) => {
                        const status = String(value) as OrderStatus;
                        return ORDER_STATUS_LABELS[status] ?? String(value);
                      }}
                    />
                    <Bar dataKey="count" fill="#3366FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </section>
            ) : (
              <EmptyState
                description="Belum ada pesanan pada rentang tanggal ini."
                title="Status Kosong"
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pesanan Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable dense>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overview.recent.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.orderNumber}</TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{formatRp(Number(order.grandTotal))}</TableCell>
                    <TableCell>{formatDateTime(order.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </DataTable>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Error Sistem Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.recent.systemErrors.length ? (
              <DataTable dense>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Pesan</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.recent.systemErrors.map((error) => (
                    <TableRow key={error.id}>
                      <TableCell>{error.source}</TableCell>
                      <TableCell>{error.severity}</TableCell>
                      <TableCell>{error.safeMessage}</TableCell>
                      <TableCell>{formatDateTime(error.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DataTable>
            ) : (
              <EmptyState
                description="Tidak ada error aplikasi yang tercatat."
                title="Tidak Ada Error"
              />
            )}
          </CardContent>
        </Card>
      </section>
    </section>
  );
}
