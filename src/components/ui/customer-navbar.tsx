"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  PackageSearch,
  ShoppingCart,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ROUTES } from "@/constants/routes";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { mc } from "@/utils/mc";

import { BrandLogo } from "./brand-logo";
import { ButtonLink } from "./button";

const PUBLIC_NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: ROUTES.CATALOG.INDEX, label: "Katalog" },
  { href: ROUTES.PROFILE, label: "Profil Klinik" },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Shared sticky top navigation for all customer-facing pages.
 * Handles both guest and authenticated states without layout shift.
 */
export function CustomerNavbar() {
  const pathname = usePathname();
  const auth = useAuth();
  const cart = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const user = auth.data?.user;
  const cartCount = cart.items.length;

  return (
    <header className="sticky top-0 z-40 border-b border-border-default bg-card-surface">
      <nav
        aria-label="Navigasi utama"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6"
      >
        {/* Logo */}
        <Link aria-label="Beranda Makmur Farma" className="shrink-0" href="/">
          <BrandLogo />
        </Link>

        {/* Desktop navigation */}
        <ul className="hidden flex-1 items-center gap-0.5 md:flex">
          {PUBLIC_NAV_ITEMS.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  aria-current={active ? "page" : undefined}
                  className={mc(
                    "ts-sm rounded-lg px-3 py-2 transition-colors",
                    active
                      ? "bg-primary-blue-soft font-medium text-primary-blue"
                      : "text-text-default hover:bg-muted-surface",
                  )}
                  href={item.href}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
          {user?.role === "CUSTOMER" && (
            <li>
              <Link
                aria-current={
                  isActivePath(pathname, ROUTES.ACCOUNT) ? "page" : undefined
                }
                className={mc(
                  "ts-sm rounded-lg px-3 py-2 transition-colors",
                  isActivePath(pathname, ROUTES.ACCOUNT)
                    ? "bg-primary-blue-soft font-medium text-primary-blue"
                    : "text-text-default hover:bg-muted-surface",
                )}
                href={ROUTES.ACCOUNT}
              >
                Riwayat
              </Link>
            </li>
          )}
        </ul>

        {/* Right section */}
        <div className="flex items-center gap-1">
          {/* Cart icon */}
          <Link
            aria-label={
              cartCount > 0 ? `Keranjang, ${cartCount} item` : "Keranjang"
            }
            className="relative rounded-lg p-2 text-text-default transition-colors hover:bg-muted-surface"
            href={ROUTES.CART}
          >
            <ShoppingCart aria-hidden="true" className="size-5" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary-blue text-[10px] font-semibold text-text-inverse"
              >
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* Auth state — reserve space when loading to prevent layout shift */}
          <div className="h-9 min-w-[2.25rem]">
            {!auth.isLoading && (
              <>
                {user ? (
                  /* User dropdown */
                  <div className="relative">
                    <button
                      aria-expanded={userMenuOpen}
                      aria-haspopup="menu"
                      className="ts-sm flex h-9 items-center gap-1.5 rounded-lg px-2 text-text-default transition-colors hover:bg-muted-surface sm:px-3"
                      onClick={() => setUserMenuOpen((prev) => !prev)}
                      type="button"
                    >
                      <User aria-hidden="true" className="size-4 shrink-0" />
                      <span className="hidden max-w-28 truncate sm:inline">
                        {user.name}
                      </span>
                      <ChevronDown
                        aria-hidden="true"
                        className={mc(
                          "size-3.5 transition-transform duration-150",
                          userMenuOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {userMenuOpen && (
                      <>
                        {/* Backdrop */}
                        <button
                          aria-hidden="true"
                          className="fixed inset-0 z-40 cursor-default"
                          onClick={() => setUserMenuOpen(false)}
                          tabIndex={-1}
                          type="button"
                        />
                        {/* Dropdown panel */}
                        <div
                          className="absolute right-0 top-full z-50 mt-1.5 min-w-52 overflow-hidden rounded-xl border border-border-default bg-card-surface shadow-lg"
                          role="menu"
                        >
                          <div className="border-b border-border-default px-4 py-3">
                            <p className="ts-sm truncate font-medium text-text-strong">
                              {user.name}
                            </p>
                            <p className="ts-xs truncate text-text-muted">
                              {user.email}
                            </p>
                          </div>
                          <div className="p-1">
                            <Link
                              className="ts-sm flex items-center gap-2.5 rounded-lg px-3 py-2 text-text-default transition-colors hover:bg-muted-surface"
                              href={ROUTES.ACCOUNT}
                              onClick={() => setUserMenuOpen(false)}
                              role="menuitem"
                            >
                              <User aria-hidden="true" className="size-4" />
                              Akun Saya
                            </Link>
                            <Link
                              className="ts-sm flex items-center gap-2.5 rounded-lg px-3 py-2 text-text-default transition-colors hover:bg-muted-surface"
                              href={`${ROUTES.ACCOUNT}#pesanan`}
                              onClick={() => setUserMenuOpen(false)}
                              role="menuitem"
                            >
                              <PackageSearch
                                aria-hidden="true"
                                className="size-4"
                              />
                              Riwayat Pembelian
                            </Link>
                            <div className="mx-1 my-1 border-t border-border-default" />
                            <Link
                              className="ts-sm flex items-center gap-2.5 rounded-lg px-3 py-2 text-danger transition-colors hover:bg-danger-bg"
                              href={ROUTES.LOGOUT}
                              onClick={() => setUserMenuOpen(false)}
                              role="menuitem"
                            >
                              <LogOut aria-hidden="true" className="size-4" />
                              Keluar
                            </Link>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Login / Register */
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <ButtonLink
                      href={ROUTES.LOGIN}
                      size="sm"
                      variant="secondary"
                    >
                      Masuk
                    </ButtonLink>
                    <ButtonLink href={ROUTES.REGISTER} size="sm">
                      Daftar
                    </ButtonLink>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
            className="rounded-lg p-2 text-text-default transition-colors hover:bg-muted-surface md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            type="button"
          >
            {mobileOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <nav
          aria-label="Menu mobile"
          className="border-t border-border-default bg-card-surface px-4 pb-4 pt-3 md:hidden"
        >
          <ul className="grid gap-0.5">
            {PUBLIC_NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    aria-current={active ? "page" : undefined}
                    className={mc(
                      "ts-sm flex rounded-lg px-3 py-2.5 transition-colors",
                      active
                        ? "bg-primary-blue-soft font-medium text-primary-blue"
                        : "text-text-default hover:bg-muted-surface",
                    )}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {user?.role === "CUSTOMER" && (
              <li>
                <Link
                  aria-current={
                    isActivePath(pathname, ROUTES.ACCOUNT) ? "page" : undefined
                  }
                  className={mc(
                    "ts-sm flex rounded-lg px-3 py-2.5 transition-colors",
                    isActivePath(pathname, ROUTES.ACCOUNT)
                      ? "bg-primary-blue-soft font-medium text-primary-blue"
                      : "text-text-default hover:bg-muted-surface",
                  )}
                  href={ROUTES.ACCOUNT}
                  onClick={() => setMobileOpen(false)}
                >
                  Riwayat & Akun
                </Link>
              </li>
            )}
            {!user && !auth.isLoading && (
              <>
                <li className="mt-1 border-t border-border-default pt-1">
                  <Link
                    className="ts-sm flex rounded-lg px-3 py-2.5 text-text-default transition-colors hover:bg-muted-surface"
                    href={ROUTES.LOGIN}
                    onClick={() => setMobileOpen(false)}
                  >
                    Masuk
                  </Link>
                </li>
                <li>
                  <Link
                    className="ts-sm flex rounded-lg px-3 py-2.5 text-text-default transition-colors hover:bg-muted-surface"
                    href={ROUTES.REGISTER}
                    onClick={() => setMobileOpen(false)}
                  >
                    Daftar Akun
                  </Link>
                </li>
              </>
            )}
            {user && (
              <li className="mt-1 border-t border-border-default pt-1">
                <Link
                  className="ts-sm flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-danger transition-colors hover:bg-danger-bg"
                  href={ROUTES.LOGOUT}
                  onClick={() => setMobileOpen(false)}
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Keluar
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
