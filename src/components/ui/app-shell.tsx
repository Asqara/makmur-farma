import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { NAVIGATION_COPY } from "@/constants/design";
import { mc } from "@/utils/mc";

import { BrandLogo } from "./brand-logo";

/**
 * Single app shell navigation item.
 */
export type AppShellNavItem = {
  active?: boolean;
  badge?: ReactNode;
  href: string;
  icon?: ReactNode;
  label: string;
};

/**
 * Navigation group for the dashboard sidebar.
 */
export type AppShellNavGroup = {
  icon?: ReactNode;
  items: AppShellNavItem[];
  label: string;
};

/**
 * Props for the Makmur Farma dashboard shell.
 */
export type AppShellProps = ComponentPropsWithoutRef<"section"> & {
  collapsed?: boolean;
  mobileOpen?: boolean;
  navGroups: AppShellNavGroup[];
  onMobileOpenChange?: (open: boolean) => void;
  topItems?: AppShellNavItem[];
  pageActions?: ReactNode;
  sidebarActions?: ReactNode;
  title: string;
  userMenu?: ReactNode;
  warehouseContext?: ReactNode;
};

type SidebarContentProps = {
  collapsed?: boolean;
  navGroups: AppShellNavGroup[];
  onNavigate?: () => void;
  sidebarActions?: ReactNode;
  topItems?: AppShellNavItem[];
  userMenu?: ReactNode;
};

function NavItem({
  collapsed,
  item,
  onNavigate,
}: {
  collapsed?: boolean;
  item: AppShellNavItem;
  onNavigate?: () => void;
}) {
  const baseClass = mc(
    "ts-sm flex min-w-0 items-center gap-2.5 rounded-lg px-3 font-medium transition-colors",
    "text-sidebar-text hover:bg-sidebar-hover hover:text-text-strong",
    item.active && "bg-sidebar-active-bg text-sidebar-active-text font-semibold",
    collapsed ? "min-h-10 justify-center px-0" : "min-h-10",
  );

  let iconNode: ReactNode = null;

  if (item.icon) {
    iconNode = (
      <span
        aria-hidden="true"
        className="inline-flex shrink-0 [&>svg]:size-[18px] [&>svg]:stroke-[1.75]"
      >
        {item.icon}
      </span>
    );
  }

  let badgeNode: ReactNode = null;

  if (!collapsed && item.badge) {
    badgeNode = (
      <span className="ml-auto shrink-0">{item.badge}</span>
    );
  }

  const inner = collapsed ? (
    <>
      {iconNode}
      <span className="sr-only">{item.label}</span>
    </>
  ) : (
    <>
      {iconNode}
      <span className="truncate">{item.label}</span>
      {badgeNode}
    </>
  );

  return (
    <a
      aria-current={item.active ? "page" : undefined}
      className={baseClass}
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
    >
      {inner}
    </a>
  );
}

function SidebarContent({
  collapsed = false,
  navGroups,
  onNavigate,
  sidebarActions,
  topItems,
  userMenu,
}: SidebarContentProps) {
  let footerNode: ReactNode = null;

  if (userMenu) {
    footerNode = (
      <footer
        className={mc(
          "mt-auto border-t border-sidebar-border px-3 py-4",
          collapsed && "px-2",
        )}
      >
        {userMenu}
      </footer>
    );
  }

  const topItemsNode = (topItems ?? []).length ? (
    <ul className="grid gap-0.5 px-1">
      {(topItems ?? []).map((item) => (
        <li key={item.href}>
          <NavItem collapsed={collapsed} item={item} onNavigate={onNavigate} />
        </li>
      ))}
    </ul>
  ) : null;

  const groupNodes = navGroups.map((group) => (
    <section className="grid gap-0.5" key={group.label}>
      {!collapsed && (
        <p
          className={mc(
            "ts-xs mb-1 px-3 font-semibold uppercase tracking-widest",
            "text-sidebar-group-label",
          )}
        >
          {group.label}
        </p>
      )}
      <ul className="grid gap-0.5 px-1">
        {group.items.map((item) => (
          <li key={item.href}>
            <NavItem
              collapsed={collapsed}
              item={item}
              onNavigate={onNavigate}
            />
          </li>
        ))}
      </ul>
    </section>
  ));

  return (
    <section className="flex h-full flex-col">
      {/* Brand area */}
      <header
        className={mc(
          "flex shrink-0 items-center border-b border-sidebar-border px-4",
          collapsed ? "h-[68px] justify-center px-2" : "h-[68px] justify-between",
        )}
      >
        <BrandLogo
          className={mc(collapsed ? "hidden" : "block")}
          variant="horizontal"
        />
        {collapsed && (
          <BrandLogo variant="compact" />
        )}
        {!collapsed && sidebarActions && (
          <section className="flex items-center gap-1">
            {sidebarActions}
          </section>
        )}
      </header>

      {/* Navigation */}
      <nav
        aria-label={NAVIGATION_COPY.main}
        className={mc(
          "flex flex-1 flex-col gap-4 overflow-y-auto px-1 py-4",
          collapsed && "items-center px-0",
        )}
      >
        {topItemsNode}
        {groupNodes}
      </nav>

      {footerNode}
    </section>
  );
}

/**
 * Dashboard shell with white sidebar, topbar, and responsive main content.
 * On mobile the sidebar collapses into a left drawer.
 */
export function AppShell({
  children,
  className,
  collapsed = false,
  mobileOpen = false,
  navGroups,
  onMobileOpenChange,
  topItems,
  pageActions,
  sidebarActions,
  title,
  userMenu,
  warehouseContext,
  ...props
}: AppShellProps) {
  const shellClassName = mc(
    "ssp-app-shell",
    collapsed && "ssp-app-shell-collapsed",
  );

  let warehouseNode: ReactNode = null;

  if (warehouseContext) {
    warehouseNode = (
      <section className="flex items-center gap-2">{warehouseContext}</section>
    );
  }

  let pageActionsNode: ReactNode = null;

  if (pageActions) {
    pageActionsNode = (
      <section className="flex items-center gap-2">{pageActions}</section>
    );
  }

  let mobileSidebarNode: ReactNode = null;

  if (mobileOpen) {
    mobileSidebarNode = (
      <section
        aria-label="Menu mobile"
        className="fixed inset-0 z-50 lg:hidden"
      >
        {/* Overlay */}
        <button
          aria-label="Tutup menu"
          className="absolute inset-0 bg-primary-navy/40"
          onClick={() => onMobileOpenChange?.(false)}
          type="button"
        />
        {/* Drawer */}
        <aside className="absolute inset-y-0 left-0 w-[min(280px,calc(100vw-2rem))] overflow-y-auto border-r border-sidebar-border bg-sidebar-surface shadow-dialog">
          <SidebarContent
            navGroups={navGroups}
            onNavigate={() => onMobileOpenChange?.(false)}
            sidebarActions={sidebarActions}
            topItems={topItems}
            userMenu={userMenu}
          />
        </aside>
      </section>
    );
  }

  return (
    <section className={mc(shellClassName, className)} {...props}>
      <aside className="ssp-sidebar">
        <SidebarContent
          collapsed={collapsed}
          navGroups={navGroups}
          sidebarActions={sidebarActions}
          topItems={topItems}
          userMenu={userMenu}
        />
      </aside>
      {mobileSidebarNode}
      <main className="ssp-main">
        <header className="ssp-page-header">
          <section className="flex min-w-0 items-center gap-3">
            {pageActionsNode}
            <h1 className="ts-lg truncate font-semibold text-text-strong md:ts-xl">
              {title}
            </h1>
          </section>
          {warehouseNode}
        </header>
        <section className="ssp-page-content">{children}</section>
      </main>
    </section>
  );
}
