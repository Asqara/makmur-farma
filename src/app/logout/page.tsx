"use client";

import { LogOut } from "lucide-react";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";

import { BrandLogo } from "@/components/ui";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { useLogoutMutation } from "@/hooks/useAuth";

/**
 * Logout page revokes the active session.
 */
export default function LogoutPage() {
  const hasSubmitted = useRef(false);
  const logout = useLogoutMutation();

  useEffect(() => {
    if (hasSubmitted.current) return;
    hasSubmitted.current = true;

    // mutateAsync attaches the redirect to the Promise directly so it fires
    // even if the component unmounts before the request completes.
    logout
      .mutateAsync(undefined)
      .catch(() => {})
      .finally(() => {
        window.location.replace("/");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-page-background p-6">
      <Helmet>
        <title>Keluar | {APP_NAME}</title>
        <meta content={APP_META_DESCRIPTION} name="description" />
      </Helmet>
      <section className="grid gap-4 text-center">
        <BrandLogo className="mx-auto" />
        <section className="grid gap-2">
          <LogOut aria-hidden="true" className="mx-auto size-8 text-primary-blue" />
          <h1 className="ts-xl font-semibold text-text-strong">
            Mengakhiri sesi...
          </h1>
          <p className="ts-sm text-text-muted">
            Anda akan diarahkan ke beranda.
          </p>
        </section>
      </section>
    </main>
  );
}
