"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";

import { BrandLogo } from "@/components/ui";
import { APP_META_DESCRIPTION, APP_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { useLogoutMutation } from "@/hooks/useAuth";
import { toast } from "@/components/ui/toast";

/**
 * Logout page revokes the active session.
 */
export default function LogoutPage() {
  const hasSubmitted = useRef(false);
  const logout = useLogoutMutation();
  const router = useRouter();

  useEffect(() => {
    if (hasSubmitted.current) {
      return;
    }

    hasSubmitted.current = true;
    if (!logout.isPending) {
      if (logout.error) {
        toast.error("Gagal menghapus session. Silakan coba lagi.");
      }
      logout.mutate(undefined, {
        onSettled: () => {
          router.replace(`${ROUTES.LOGIN}?reason=logout`);
        },
      });
    }
  }, [logout, router]);

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
            Menghapus sesi...
          </h1>
          <p className="ts-sm text-text-muted">
            Anda akan diarahkan ke halaman masuk.
          </p>
        </section>
      </section>
    </main>
  );
}
