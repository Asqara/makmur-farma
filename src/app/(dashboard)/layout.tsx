"use client";

import {
  Activity,
  BarChart3,
  Bell,
  ClipboardList,
  FileBarChart2,
  FileText,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Pill,
  Receipt,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Truck,
  UserCog,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  AppShell,
  Badge,
  Button,
  BrandLogo,
  ConfirmDialog,
  PermissionState,
  type AppShellNavGroup,
} from "@/components/ui";
import {
  NAVIGATION_SECTION_LABELS,
  OVERLAY_Z_INDEX_CLASS_NAMES,
} from "@/constants/design";
import { OPERATIONAL_ROLE_VALUES, USER_ROLE_LABELS } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { isUnauthorizedError, useAuth } from "@/hooks/useAuth";
import { eden } from "@/lib/eden";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { formatDateTime } from "@/utils/inventoryDisplay";
import { mc } from "@/utils/mc";
import { hasPermission } from "@/utils/permissions";

const LOGOUT_DIALOG_ID = "logout-confirm";

type DashboardLayoutProps = {
  children: ReactNode;
};

type UserMenuProps = {
  collapsed: boolean;
  email: string;
  name: string;
  role: string;
};

type NotificationOverviewRecord = {
  createdAt: Date | string;
  id: string;
  message: string;
  severity: "critical" | "info" | "success" | "warning";
  title: string;
};

function getTitle(pathname: string) {
  if (pathname === ROUTES.DASHBOARD) return "Dashboard";
  if (pathname === ROUTES.ORDERS.INDEX) return "Pesanan";
  if (pathname === ROUTES.CASHIER) return "Penjualan Kasir";
  if (pathname === ROUTES.PAYMENTS.INDEX) return "Pembayaran";
  if (pathname === ROUTES.MEDICINES.INDEX) return "Obat";
  if (pathname === ROUTES.CATEGORIES) return "Kategori Obat";
  if (pathname === ROUTES.PRESCRIPTIONS.INDEX) return "Resep";
  if (pathname === ROUTES.SUPPLIERS) return "Supplier";
  if (pathname === ROUTES.BATCHES.INDEX) return "Batch dan Stok";
  if (pathname === ROUTES.STOCK_MOVEMENTS) return "Pergerakan Stok";
  if (pathname === ROUTES.STOCK_ADJUSTMENTS) return "Penyesuaian Stok";
  if (pathname === ROUTES.EXPIRY || pathname.startsWith("/batches/expiry")) return "Monitor Kedaluwarsa";
  if (pathname === ROUTES.CUSTOMERS) return "Pelanggan";
  if (pathname.startsWith(ROUTES.REPORTS.INDEX)) return "Laporan";
  if (pathname === ROUTES.NOTIFICATIONS) return "Notifikasi";
  if (pathname === ROUTES.AUDIT_LOGS) return "Audit Log";
  if (pathname === ROUTES.ERROR_LOGS) return "Error Log";
  if (pathname === ROUTES.JOBS) return "Job";
  if (pathname === ROUTES.MONITORING) return "Monitoring";
  if (pathname === ROUTES.USERS) return "Pengguna";
  if (pathname === ROUTES.SETTINGS) return "Pengaturan";
  if (pathname === ROUTES.PROFILE) return "Profil";
  if (pathname === ROUTES.DESIGN_SYSTEM) return "Design System";
  return "Dashboard";
}

function UserMenu({ collapsed, email, name, role }: UserMenuProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <section
      className={mc(
        "flex flex-col gap-2",
        collapsed ? "items-center" : "",
      )}
    >
      <section
        className={mc(
          "flex items-center gap-3",
          collapsed && "justify-center",
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-blue-soft text-primary-blue ts-xs font-semibold uppercase">
          {name.slice(0, 2)}
        </span>

        {!collapsed && (
          <section className="min-w-0">
            <p className="ts-sm truncate font-semibold text-text-strong">
              {name}
            </p>
            <p className="ts-xs truncate text-text-muted">{email}</p>
            <p className="ts-xs text-text-muted">{role}</p>
          </section>
        )}
      </section>

      <Button
        className={mc(
          "text-text-default",
          collapsed ? "justify-center px-2 size-10" : "w-full justify-start px-3",
        )}
        onClick={() => setLogoutOpen(true)}
        size={collapsed ? "icon" : "default"}
        variant="ghost"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {!collapsed && <span className="ts-sm">Keluar</span>}
      </Button>

      <ConfirmDialog
        confirmLabel="Keluar"
        description="Session Anda akan diakhiri. Anda perlu masuk kembali untuk mengakses Makmur Farma."
        id={LOGOUT_DIALOG_ID}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => {
          window.location.href = ROUTES.LOGOUT;
        }}
        open={logoutOpen}
        title="Keluar dari Aplikasi"
        variant="danger"
      />
    </section>
  );
}

function useNotificationOverview(enabled: boolean) {
  return useQuery({
    enabled,
    queryFn: async () => {
      const response = await eden.api.notifications.get({
        query: {
          isRead: "false",
          limit: "5",
          page: "1",
          sortBy: "createdAt",
          sortDir: "desc",
        },
      });

      if (response.error) throw response.error;

      return response.data;
    },
    queryKey: ["notifications", "overview"],
    refetchInterval: 10_000,
  });
}

function getNotificationDotClassName(
  severity: NotificationOverviewRecord["severity"],
) {
  if (severity === "critical") return "bg-danger";
  if (severity === "warning") return "bg-warning";
  if (severity === "success") return "bg-success";
  return "bg-info";
}

function NotificationOverview({ enabled }: { enabled: boolean }) {
  const [open, setOpen] = useState(false);
  const notificationsQuery = useNotificationOverview(enabled);
  const notifications =
    (notificationsQuery.data?.data ?? []) as NotificationOverviewRecord[];
  const unreadCount = notificationsQuery.data?.pagination?.total ?? 0;
  const hasUnread = unreadCount > 0;

  const notificationNodes = notifications.map((notification) => (
    <li key={notification.id}>
      <section className="flex min-w-0 items-start gap-3 rounded-lg px-2 py-2 hover:bg-hover-surface">
        <span
          aria-hidden="true"
          className={mc(
            "mt-1 size-2 shrink-0 rounded-full",
            getNotificationDotClassName(notification.severity),
          )}
        />
        <section className="min-w-0">
          <p className="ts-sm truncate font-semibold text-text-strong">
            {notification.title}
          </p>
          <p className="ts-xs line-clamp-2 text-text-muted">
            {notification.message}
          </p>
          <p className="ts-xs mt-1 text-text-disabled">
            {formatDateTime(notification.createdAt)}
          </p>
        </section>
      </section>
    </li>
  ));

  let contentNode: ReactNode = notificationNodes;

  if (notificationNodes.length === 0) {
    contentNode = (
      <li className="px-2 py-3 text-center">
        <p className="ts-sm text-text-muted">Tidak ada notifikasi baru.</p>
      </li>
    );
  }

  if (!enabled) {
    return null;
  }

  return (
    <section
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
        }
      }}
    >
      <Button
        aria-expanded={open}
        aria-label="Buka notifikasi"
        className={mc(
          "relative",
          hasUnread && "border-danger-border bg-danger-bg text-danger",
        )}
        onClick={() => setOpen((o) => !o)}
        size="icon"
        type="button"
        variant="secondary"
      >
        <Bell aria-hidden="true" className="size-4" />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-text-inverse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <section
          className={mc(
            "absolute right-0 top-full mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border-default bg-elevated-surface p-3 shadow-floating",
            OVERLAY_Z_INDEX_CLASS_NAMES.popover,
          )}
        >
          <header className="mb-2 flex items-center justify-between gap-3">
            <section className="grid gap-0.5">
              <p className="ts-sm font-semibold text-text-strong">Notifikasi</p>
              <p className="ts-xs text-text-muted">{unreadCount} belum dibaca</p>
            </section>
            <Badge tone={hasUnread ? "danger" : "neutral"}>
              {hasUnread ? "Baru" : "Kosong"}
            </Badge>
          </header>
          <ul className="grid max-h-72 gap-1 overflow-y-auto">
            {contentNode}
          </ul>
          <Link
            className="ts-sm mt-3 flex min-h-10 items-center justify-center rounded-md border border-border-default text-text-strong hover:bg-hover-surface"
            href={ROUTES.NOTIFICATIONS}
            onClick={() => setOpen(false)}
          >
            Lihat Semua Notifikasi
          </Link>
        </section>
      ) : null}
    </section>
  );
}

/**
 * Protected dashboard layout with Makmur Farma permission-aware sidebar navigation.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useAuth();
  const pathname = usePathname();

  const user = auth.data?.user;
  const isSessionExpired = auth.isError && isUnauthorizedError(auth.error);
  const hasSessionCheckError = auth.isError && !isSessionExpired;
  const title = getTitle(pathname);
  const canReadNotifications = user
    ? hasPermission(user.role, "notification.read")
    : false;
  const canUseOperationalShell = user
    ? OPERATIONAL_ROLE_VALUES.includes(user.role)
    : false;

  let navGroups: AppShellNavGroup[] = [];
  let userMenu: ReactNode = null;

  if (user) {
    // ── PENJUALAN ──────────────────────────────────────────────────────────
    const salesItems = [];

    if (hasPermission(user.role, "order.read")) {
      salesItems.push({
        active: pathname.startsWith(ROUTES.ORDERS.INDEX),
        href: ROUTES.ORDERS.INDEX,
        icon: <ShoppingCart />,
        label: "Pesanan",
      });
    }

    if (hasPermission(user.role, "order.write")) {
      salesItems.push({
        active: pathname === ROUTES.CASHIER,
        href: ROUTES.CASHIER,
        icon: <Receipt />,
        label: "Penjualan Kasir",
      });
    }

    if (hasPermission(user.role, "payment.read")) {
      salesItems.push({
        active: pathname.startsWith(ROUTES.PAYMENTS.INDEX),
        href: ROUTES.PAYMENTS.INDEX,
        icon: <FileText />,
        label: "Pembayaran",
      });
    }

    // ── FARMASI ────────────────────────────────────────────────────────────
    const pharmacyItems = [];

    if (hasPermission(user.role, "medicine.read")) {
      pharmacyItems.push({
        active: pathname.startsWith(ROUTES.MEDICINES.INDEX),
        href: ROUTES.MEDICINES.INDEX,
        icon: <Pill />,
        label: "Obat",
      });
    }

    if (hasPermission(user.role, "category.read")) {
      pharmacyItems.push({
        active: pathname === ROUTES.CATEGORIES,
        href: ROUTES.CATEGORIES,
        icon: <Tag />,
        label: "Kategori Obat",
      });
    }

    if (hasPermission(user.role, "prescription.read")) {
      pharmacyItems.push({
        active: pathname.startsWith(ROUTES.PRESCRIPTIONS.INDEX),
        href: ROUTES.PRESCRIPTIONS.INDEX,
        icon: <ClipboardList />,
        label: "Resep",
      });
    }

    if (hasPermission(user.role, "supplier.read")) {
      pharmacyItems.push({
        active: pathname === ROUTES.SUPPLIERS,
        href: ROUTES.SUPPLIERS,
        icon: <Truck />,
        label: "Supplier",
      });
    }

    // ── PERSEDIAAN ─────────────────────────────────────────────────────────
    const inventoryItems = [];

    if (hasPermission(user.role, "batch.read")) {
      inventoryItems.push({
        active: pathname.startsWith(ROUTES.BATCHES.INDEX),
        href: ROUTES.BATCHES.INDEX,
        icon: <Package />,
        label: "Batch dan Stok",
      });

      inventoryItems.push({
        active: pathname === ROUTES.STOCK_MOVEMENTS,
        href: ROUTES.STOCK_MOVEMENTS,
        icon: <Activity />,
        label: "Pergerakan Stok",
      });

      inventoryItems.push({
        active: pathname === ROUTES.EXPIRY,
        href: ROUTES.EXPIRY,
        icon: <History />,
        label: "Kedaluwarsa",
      });
    }

    // ── PELANGGAN ──────────────────────────────────────────────────────────
    const customerItems = [];

    if (hasPermission(user.role, "customer.read")) {
      customerItems.push({
        active: pathname === ROUTES.CUSTOMERS,
        href: ROUTES.CUSTOMERS,
        icon: <Users />,
        label: "Pelanggan",
      });
    }

    // ── LAPORAN ────────────────────────────────────────────────────────────
    const reportItems = [];

    if (hasPermission(user.role, "report.read")) {
      reportItems.push({
        active: pathname.startsWith(ROUTES.REPORTS.INDEX),
        href: ROUTES.REPORTS.INDEX,
        icon: <FileBarChart2 />,
        label: "Laporan Penjualan",
      });
    }

    // ── SISTEM ─────────────────────────────────────────────────────────────
    const systemItems = [];

    if (hasPermission(user.role, "notification.read")) {
      systemItems.push({
        active: pathname === ROUTES.NOTIFICATIONS,
        href: ROUTES.NOTIFICATIONS,
        icon: <Bell />,
        label: "Notifikasi",
      });
    }

    if (hasPermission(user.role, "audit_log.read")) {
      systemItems.push({
        active: pathname === ROUTES.AUDIT_LOGS,
        href: ROUTES.AUDIT_LOGS,
        icon: <ClipboardList />,
        label: "Audit Log",
      });
    }

    if (hasPermission(user.role, "error_log.read")) {
      systemItems.push({
        active: pathname === ROUTES.ERROR_LOGS,
        href: ROUTES.ERROR_LOGS,
        icon: <Activity />,
        label: "Error Log",
      });
    }

    if (hasPermission(user.role, "monitoring.read")) {
      systemItems.push({
        active: pathname === ROUTES.MONITORING,
        href: ROUTES.MONITORING,
        icon: <BarChart3 />,
        label: "Monitoring",
      });

      systemItems.push({
        active: pathname === ROUTES.JOBS,
        href: ROUTES.JOBS,
        icon: <Activity />,
        label: "Job",
      });
    }

    if (hasPermission(user.role, "user.read")) {
      systemItems.push({
        active: pathname === ROUTES.USERS,
        href: ROUTES.USERS,
        icon: <UserCog />,
        label: "Pengguna",
      });
    }

    // Push non-empty groups
    if (salesItems.length > 0) {
      navGroups.push({
        items: salesItems,
        label: NAVIGATION_SECTION_LABELS.penjualan,
      });
    }

    if (pharmacyItems.length > 0) {
      navGroups.push({
        items: pharmacyItems,
        label: NAVIGATION_SECTION_LABELS.farmasi,
      });
    }

    if (inventoryItems.length > 0) {
      navGroups.push({
        items: inventoryItems,
        label: NAVIGATION_SECTION_LABELS.persediaan,
      });
    }

    if (customerItems.length > 0) {
      navGroups.push({
        items: customerItems,
        label: NAVIGATION_SECTION_LABELS.pelanggan,
      });
    }

    if (reportItems.length > 0) {
      navGroups.push({
        items: reportItems,
        label: NAVIGATION_SECTION_LABELS.laporan,
      });
    }

    if (systemItems.length > 0) {
      navGroups.push({
        items: systemItems,
        label: NAVIGATION_SECTION_LABELS.sistem,
      });
    }

    userMenu = (
      <UserMenu
        collapsed={collapsed}
        email={user.email}
        name={user.name}
        role={USER_ROLE_LABELS[user.role] ?? user.role}
      />
    );
  }

  const sidebarActions = (
    <Button
      aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
      className="hidden lg:inline-flex"
      onClick={() => setCollapsed((v) => !v)}
      size="icon"
      variant="ghost"
    >
      {collapsed ? (
        <PanelLeftOpen aria-hidden="true" />
      ) : (
        <PanelLeftClose aria-hidden="true" />
      )}
    </Button>
  );

  const pageActions = (
    <Button
      aria-label="Buka menu navigasi"
      className="lg:hidden"
      onClick={() => setMobileOpen(true)}
      size="icon"
      variant="ghost"
    >
      <Menu aria-hidden="true" />
    </Button>
  );


  if (auth.isLoading || isSessionExpired) {
    return (
      <main className="grid min-h-screen place-items-center bg-page-background p-6">
        <section className="grid gap-4 text-center">
          <BrandLogo className="mx-auto" />
          <p className="ts-sm text-text-muted">
            {isSessionExpired
              ? "Session Anda telah berakhir. Mengarahkan ke login..."
              : "Memeriksa session..."}
          </p>
        </section>
      </main>
    );
  }

  if (hasSessionCheckError) {
    return (
      <main className="grid min-h-screen place-items-center bg-page-background p-6">
        <section className="grid max-w-md gap-4 text-center">
          <BrandLogo className="mx-auto" />
          <section className="rounded-lg border border-danger-border bg-danger-bg px-4 py-3 text-danger">
            <p className="ts-sm font-medium">
              {getErrorMessage(auth.error, "Session gagal diperiksa.")}
            </p>
          </section>
          <Button onClick={() => auth.refetch()} type="button">
            Coba Lagi
          </Button>
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center bg-page-background p-6">
        <section className="grid gap-4 text-center">
          <BrandLogo className="mx-auto" />
          <p className="ts-sm text-text-muted">Memuat data pengguna...</p>
        </section>
      </main>
    );
  }

  if (!canUseOperationalShell) {
    return (
      <main className="grid min-h-screen place-items-center bg-page-background p-6">
        <PermissionState
          backHref={ROUTES.ACCOUNT}
          backLabel="Kembali ke Akun"
          description="Halaman operasional hanya dapat diakses oleh Admin, Apoteker, dan Kasir."
        />
      </main>
    );
  }

  return (
    <AppShell
      collapsed={collapsed}
      mobileOpen={mobileOpen}
      navGroups={navGroups}
      onMobileOpenChange={setMobileOpen}
      pageActions={pageActions}
      sidebarActions={sidebarActions}
      topItems={[
        {
          active: pathname === ROUTES.DASHBOARD,
          href: ROUTES.DASHBOARD,
          icon: <LayoutDashboard />,
          label: "Dashboard",
        },
      ]}
      title={title}
      userMenu={userMenu}
      warehouseContext={
        <section className="flex items-center gap-2">
          <span className="ts-sm inline-flex items-center gap-2 text-text-default">
            <ShieldCheck aria-hidden="true" className="size-4 text-success" />
            Session aktif
          </span>
          <NotificationOverview enabled={canReadNotifications} />
        </section>
      }
    >
      {children}
    </AppShell>
  );
}
