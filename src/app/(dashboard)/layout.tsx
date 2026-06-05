"use client";

import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Boxes,
  FileText,
  Package,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Upload,
  UserCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

const LOGOUT_DIALOG_ID = "logout-confirm";

import {
  AppShell,
  Badge,
  Button,
  BrandLogo,
  ConfirmDialog,
  type AppShellNavGroup,
} from "@/components/ui";
import { NAVIGATION_SECTION_LABELS } from "@/constants/design";
import { USER_ROLE_LABELS } from "@/constants/auth";
import { ROUTES } from "@/constants/routes";
import { isUnauthorizedError, useAuth } from "@/hooks/useAuth";
import { eden } from "@/lib/eden";
import { getErrorMessage } from "@/utils/getErrorMessage";
import { formatDateTime } from "@/utils/inventoryDisplay";
import { mc } from "@/utils/mc";
import { hasPermission } from "@/utils/permissions";

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
  if (pathname === ROUTES.PRODUCTS.INDEX) {
    return "Produk";
  }

  if (pathname === ROUTES.PRODUCTS.GALLERY) {
    return "Galeri Produk";
  }

  if (pathname === ROUTES.PRODUCTS.DETAIL(":id")) {
    return "Detail Produk";
  }

  if (pathname === ROUTES.CATEGORIES) {
    return "Kategori";
  }

  if (pathname === ROUTES.SUPPLIERS) {
    return "Supplier";
  }

  if (pathname === ROUTES.WAREHOUSES.INDEX) {
    return "Gudang";
  }

  if (pathname === ROUTES.WAREHOUSES.MAP) {
    return "Peta Gudang";
  }

  if (pathname === ROUTES.STOCK.MOVEMENTS) {
    return "Riwayat Stok";
  }

  if (pathname === ROUTES.NOTIFICATIONS) {
    return "Notifikasi";
  }

  if (pathname === ROUTES.PROFILE) {
    return "Profil";
  }

  if (pathname === ROUTES.ERROR_LOGS) {
    return "Error Log";
  }

  if (pathname === ROUTES.MONITORING) {
    return "Monitoring";
  }

  if (pathname === ROUTES.USERS) {
    return "Manajemen User";
  }

  if (pathname === ROUTES.AUDIT_LOGS) {
    return "Audit Log";
  }

  if (pathname.startsWith(ROUTES.TRANSFERS.INDEX)) {
    return "Transfer";
  }

  if (pathname.startsWith(ROUTES.IMPORTS.INDEX)) {
    return "Import";
  }

  if (pathname.startsWith(ROUTES.REPORTS.INDEX)) {
    return "Laporan";
  }

  return "Dashboard";
}

function UserMenu({ collapsed, email, name, role }: UserMenuProps) {
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <section
      className={mc(
        "flex flex-col gap-3",
        collapsed ? "items-center" : ""
      )}
    >
      <section
        className={mc(
          "flex items-center gap-3",
          collapsed && "justify-center"
        )}
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-blue text-text-inverse">
          <Users className="size-4" />
        </span>

        {!collapsed && (
          <section className="min-w-0">
            <p className="ts-sm truncate font-semibold text-text-inverse">
              {name}
            </p>
            <p className="ts-xs truncate text-sidebar-muted">
              {email}
            </p>
            <p className="ts-xs text-sidebar-muted">
              {role}
            </p>
          </section>
        )}
      </section>

      <Link
        className={mc(
          "inline-flex min-h-10 items-center gap-2 rounded-md px-3 py-2 text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-text-inverse",
          collapsed ? "justify-center px-2" : "w-full justify-start",
        )}
        href={ROUTES.PROFILE}
      >
        <UserCircle className="size-4" />
        {!collapsed && <span className="ts-sm">Profil</span>}
      </Link>

      <Button
        className={mc(
          collapsed ? "justify-center px-2" : "w-full justify-start px-3",
        )}
        onClick={() => setLogoutOpen(true)}
        variant="ghost"
      >
        <LogOut className="size-4" />
        {!collapsed && <span className="ts-sm">Logout</span>}
      </Button>

      <ConfirmDialog
        confirmLabel="Keluar"
        description="Session Anda akan diakhiri. Anda perlu masuk kembali untuk mengakses SmartStock Pro."
        id={LOGOUT_DIALOG_ID}
        onCancel={() => setLogoutOpen(false)}
        onConfirm={() => { window.location.href = ROUTES.LOGOUT; }}
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
  if (severity === "critical") {
    return "bg-danger";
  }

  if (severity === "warning") {
    return "bg-warning";
  }

  if (severity === "success") {
    return "bg-success";
  }

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
      <section className="flex min-w-0 items-start gap-3 rounded-lg px-2 py-2 hover:bg-muted-surface">
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
      <li className="px-2 py-3 text-center text-text-muted">
        <p className="ts-sm">Tidak ada notifikasi baru.</p>
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
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        size="icon"
        type="button"
        variant="secondary"
      >
        <Bell className="size-4" />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 grid min-h-5 min-w-5 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-text-inverse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>
      {open ? (
        <section className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border-default bg-elevated-surface p-3 shadow-md">
          <header className="mb-2 flex items-center justify-between gap-3">
            <section className="grid gap-0.5">
              <p className="ts-sm font-semibold text-text-strong">Notifikasi</p>
              <p className="ts-xs text-text-muted">
                {unreadCount} belum dibaca
              </p>
            </section>
            <Badge tone={hasUnread ? "danger" : "neutral"}>
              {hasUnread ? "Baru" : "Kosong"}
            </Badge>
          </header>
          <ul className="grid max-h-72 gap-1 overflow-y-auto">
            {contentNode}
          </ul>
          <Link
            className="ts-sm mt-3 flex min-h-10 items-center justify-center rounded-md border border-border-default text-text-strong hover:bg-muted-surface"
            href={ROUTES.NOTIFICATIONS}
            onClick={() => setOpen(false)}
          >
            Lihat Semua
          </Link>
        </section>
      ) : null}
    </section>
  );
}

/**
 * Protected dashboard layout with permission-aware navigation.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const auth = useAuth();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const router = useRouter();

  const user = auth.data?.user;
  const isSessionExpired = auth.isError && isUnauthorizedError(auth.error);
  const hasSessionCheckError = auth.isError && !isSessionExpired;
  const title = getTitle(pathname);
  const canReadNotifications = user
    ? hasPermission(user.role, "notification.read")
    : false;

  let navGroups: AppShellNavGroup[] = [];
  let userMenu: ReactNode = null;

  if (user) {
    const inventoryItems = [];
    const operationItems = [];
    const systemItems = [];

    if (hasPermission(user.role, "product.read")) {
      inventoryItems.push({
        active: pathname === ROUTES.PRODUCTS.INDEX,
        href: ROUTES.PRODUCTS.INDEX,
        label: "Produk",
      });
      inventoryItems.push({
        active: pathname === ROUTES.PRODUCTS.GALLERY,
        href: ROUTES.PRODUCTS.GALLERY,
        label: "Galeri Produk",
      });
    }

    if (hasPermission(user.role, "category.read")) {
      inventoryItems.push({
        active: pathname === ROUTES.CATEGORIES,
        href: ROUTES.CATEGORIES,
        label: "Kategori",
      });
    }

    if (hasPermission(user.role, "supplier.read")) {
      inventoryItems.push({
        active: pathname === ROUTES.SUPPLIERS,
        href: ROUTES.SUPPLIERS,
        label: "Supplier",
      });
    }

    if (hasPermission(user.role, "warehouse.read")) {
      inventoryItems.push({
        active: pathname === ROUTES.WAREHOUSES.INDEX,
        href: ROUTES.WAREHOUSES.INDEX,
        label: "Gudang",
      });
    }

    if (hasPermission(user.role, "warehouse.read_map")) {
      inventoryItems.push({
        active: pathname === ROUTES.WAREHOUSES.MAP,
        href: ROUTES.WAREHOUSES.MAP,
        label: "Peta Gudang",
      });
    }

    if (hasPermission(user.role, "stock.read_movements")) {
      operationItems.push({
        active: pathname === ROUTES.STOCK.MOVEMENTS,
        href: ROUTES.STOCK.MOVEMENTS,
        label: "Riwayat Stok",
      });
    }

    if (hasPermission(user.role, "transfer.read")) {
      operationItems.push({
        active: pathname.startsWith(ROUTES.TRANSFERS.INDEX),
        href: ROUTES.TRANSFERS.INDEX,
        icon: <ArrowLeftRight />,
        label: "Transfer",
      });
    }

    if (hasPermission(user.role, "import.read")) {
      operationItems.push({
        active: pathname.startsWith(ROUTES.IMPORTS.INDEX),
        href: ROUTES.IMPORTS.INDEX,
        icon: <Upload />,
        label: "Import",
      });
    }

    if (hasPermission(user.role, "report.read")) {
      operationItems.push({
        active: pathname.startsWith(ROUTES.REPORTS.INDEX),
        href: ROUTES.REPORTS.INDEX,
        icon: <FileText />,
        label: "Laporan",
      });
    }

    if (hasPermission(user.role, "notification.read")) {
      systemItems.push({
        active: pathname === ROUTES.NOTIFICATIONS,
        href: ROUTES.NOTIFICATIONS,
        label: "Notifikasi",
      });
    }

    if (hasPermission(user.role, "error_log.read")) {
      systemItems.push({
        active: pathname === ROUTES.ERROR_LOGS,
        href: ROUTES.ERROR_LOGS,
        label: "Error Log",
      });
    }

    if (hasPermission(user.role, "monitoring.read")) {
      systemItems.push({
        active: pathname === ROUTES.MONITORING,
        href: ROUTES.MONITORING,
        label: "Monitoring",
      });
    }

    if (hasPermission(user.role, "user.read")) {
      systemItems.push({
        active: pathname === ROUTES.USERS,
        href: ROUTES.USERS,
        label: "Users",
      });
    }

    if (hasPermission(user.role, "audit_log.read")) {
      systemItems.push({
        active: pathname === ROUTES.AUDIT_LOGS,
        href: ROUTES.AUDIT_LOGS,
        label: "Audit Log",
      });
    }

    if (inventoryItems.length > 0) {
      navGroups.push({
        icon: <Package />,
        items: inventoryItems,
        label: NAVIGATION_SECTION_LABELS.inventory,
      });
    }

    if (operationItems.length > 0) {
      navGroups.push({
        icon: <Boxes />,
        items: operationItems,
        label: NAVIGATION_SECTION_LABELS.operations,
      });
    }

    if (systemItems.length > 0) {
      navGroups.push({
        icon: <Activity />,
        items: systemItems,
        label: NAVIGATION_SECTION_LABELS.system,
      });
    }

    userMenu = (
      <UserMenu
        collapsed={collapsed}
        email={user.email}
        name={user.name}
        role={USER_ROLE_LABELS[user.role]}
      />
    );
  }

  const sidebarActions = (
    <Button
      aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
      className="hidden lg:inline-flex"
      onClick={() => setCollapsed((value) => !value)}
      size="icon"
      variant="ghost"
    >
      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
    </Button>
  );

  const pageActions = (
    <Button
      aria-label="Menu"
      className="lg:hidden"
      onClick={() => setMobileOpen(true)}
      size="icon"
      variant="ghost"
    >
      <Menu />
    </Button>
  );

  useEffect(() => {
    if (isSessionExpired) {
      queryClient.removeQueries({ queryKey: ["auth"] });
      router.replace(`${ROUTES.LOGIN}?reason=session-expired`);
    }
  }, [isSessionExpired, queryClient, router]);

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
          <p className="ts-sm text-text-muted">Memuat data user...</p>
        </section>
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
      topItems={
        user
          ? [
              {
                active: pathname === ROUTES.DASHBOARD,
                href: ROUTES.DASHBOARD,
                icon: <BarChart3 />,
                label: "Dashboard",
              },
            ]
          : []
      }
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
