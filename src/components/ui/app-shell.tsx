import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

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
 * Props for the SmartStock Pro dashboard shell.
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

function SidebarContent({
  collapsed = false,
  navGroups,
  onNavigate,
  sidebarActions,
  topItems,
  userMenu,
}: SidebarContentProps) {
  let sidebarActionsNode: ReactNode = null;

  if (sidebarActions) {
    sidebarActionsNode = (
      <section className="flex items-center gap-2">
        {sidebarActions}
      </section>
    );
  }

  let footerNode: ReactNode = null;

if (userMenu) {
  footerNode = (
    <footer
      className={mc(
        "mt-auto border-t border-sidebar-border px-3 py-4",
        collapsed && "px-2"
      )}
    >
      <section className="flex items-center">
        {userMenu}
      </section>
    </footer>
  );
}

  let navContent: ReactNode = null;

  if (collapsed) {
    const collapsedItems = [
      ...(topItems ?? []).map((item) => ({
        icon: item.icon,
        item,
      })),
      ...navGroups.flatMap((group) =>
        group.items.map((item) => ({
          icon: item.icon ?? group.icon,
          item,
        })),
      ),
    ].filter((entry) => entry.icon);

    navContent = (
      <ul className="grid gap-3">
        {collapsedItems.map(({ icon, item }) => {
            const iconNode = (
              <span
                aria-hidden="true"
                className="inline-flex shrink-0 [&>svg]:size-[18px]"
              >
                {icon}
              </span>
            );

            return (
              <li key={item.href}>
                <Link
                  aria-current={item.active ? "page" : undefined}
                  className={mc(
                    "ts-sm flex min-h-10 min-w-0 items-center justify-center rounded-md px-0 font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-text-inverse",
                    item.active &&
                      "bg-sidebar-hover text-text-inverse ring-1 ring-sidebar-border",
                  )}
                  href={item.href}
                  onClick={onNavigate}
                  title={item.label}
                >
                  {iconNode}
                </Link>
              </li>
            );
          })}
      </ul>
    );
  } else {
    const topItemsNode = (topItems ?? []).length ? (
      <ul className="grid gap-1">
        {(topItems ?? []).map((item) => {
          let iconNode: ReactNode = null;

          if (item.icon) {
            iconNode = (
              <span
                aria-hidden="true"
                className="inline-flex shrink-0 [&>svg]:size-[18px]"
              >
                {item.icon}
              </span>
            );
          }

          let badgeNode: ReactNode = null;

          // if (item.badge) {
          //   badgeNode = (
          //     <span className="ml-auto shrink-0">{item.badge}</span>
          //   );
          // }

          return (
            <li key={item.href}>
              <Link
                aria-current={item.active ? "page" : undefined}
                className={mc(
                  "ts-sm flex min-h-11 min-w-0 items-center gap-3 rounded-md px-3 font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-text-inverse",
                  item.active &&
                    "bg-sidebar-hover text-text-inverse ring-1 ring-sidebar-border",
                )}
                href={item.href}
                onClick={onNavigate}
              >
                {iconNode}
                <span className="truncate">{item.label}</span>
                {badgeNode}
              </Link>
            </li>
          );
        })}
      </ul>
    ) : null;

    const groupNodes = navGroups.map((group) => (
      <details
        className="group grid gap-2 my-3"
        key={group.label}
        open={group.items.some((item) => item.active)}
      >
        <summary className="ts-xs flex items-center gap-3 px-3 font-semibold uppercase text-sidebar-muted transition-colors hover:text-text-inverse [&::-webkit-details-marker]:hidden">
          {group.icon ? (
            <span
              aria-hidden="true"
              className="inline-flex shrink-0 [&>svg]:size-[18px]"
            >
              {group.icon}
            </span>
          ) : null}
          <span className="truncate">{group.label}</span>
          <ChevronDown
            aria-hidden="true"
            className="ml-auto size-4 transition-transform group-open:rotate-180"
          />
        </summary>
        <ul className="grid gap-1 mt-3">
          {group.items.map((item) => {
            let badgeNode: ReactNode = null;

            if (item.badge) {
              badgeNode = (
                <span className="ml-auto shrink-0">{item.badge}</span>
              );
            }

            return (
              <li key={item.href}>
                <Link
                  aria-current={item.active ? "page" : undefined}
                  className={mc(
                    "ts-sm flex min-h-8 min-w-0 items-center gap-3 rounded-md px-3 font-medium text-sidebar-text transition-colors hover:bg-sidebar-hover hover:text-text-inverse",
                    item.active &&
                      "bg-sidebar-hover text-text-inverse ring-1 ring-sidebar-border",
                  )}
                  href={item.href}
                  onClick={onNavigate}
                >
                  <span className="truncate">{item.label}</span>
                  {badgeNode}
                </Link>
              </li>
            );
          })}
        </ul>
      </details>
    ));

    navContent = (
      <>
        {topItemsNode}
        {groupNodes}
      </>
    );
  }

  return (
    <section className="flex h-full flex-col">
      <header
        className={mc(
          "flex h-16 items-center border-b border-sidebar-border px-4",
          collapsed && "justify-center px-2",
        )}
      >
        <section
          className={mc(
            "flex w-full items-center",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <section className="flex min-w-0 items-center gap-3">
            <BrandLogo className={collapsed ? "hidden" : "block"} />
            
          </section>
          {sidebarActionsNode}
        </section>
      </header>
      <nav
        aria-label={NAVIGATION_COPY.main}
        className={mc(
          "grid flex-1 content-start items-start gap-2 px-3 py-3",
          collapsed && "px-2",
        )}
      >
        {navContent}
      </nav>
      {footerNode}
    </section>
  );
}

/**
 * Dashboard shell with sidebar, topbar, and responsive main content area.
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
      <section className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border-default bg-muted-surface px-3 py-2">
        {warehouseContext}
      </section>
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
      <section className="fixed inset-0 z-50 lg:hidden" aria-label="Menu mobile">
        <button
          aria-label="Tutup menu"
          className="absolute inset-0 bg-primary-navy/50"
          onClick={() => onMobileOpenChange?.(false)}
          type="button"
        />
        <aside className="absolute inset-y-0 left-0 w-[min(19rem,calc(100vw-2rem))] overflow-y-auto bg-primary-navy text-text-inverse shadow-lg">
          <SidebarContent
            sidebarActions={sidebarActions}
            navGroups={navGroups}
            onNavigate={() => onMobileOpenChange?.(false)}
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
