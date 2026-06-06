"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { HelmetProvider } from "react-helmet-async";
import { useState } from "react";

import { AppToaster } from "@/components/ui/app-toaster";
import { ROUTES } from "@/constants/routes";
import { useCartSync } from "@/hooks/useCart";

type ProvidersProps = {
  children: React.ReactNode;
};

function CartSync() {
  useCartSync();
  return null;
}

function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as Record<string, unknown>).status === 401;
}

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;

  const publicPrefixes = [
    ROUTES.CATALOG.INDEX,
    ROUTES.LOGIN,
    ROUTES.REGISTER,
    ROUTES.VERIFY_EMAIL,
    ROUTES.CHECK_EMAIL,
  ];

  return publicPrefixes.some((path) => pathname.startsWith(path));
}

/**
 * Root client providers: React Query, Jotai, Helmet.
 */
export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
        queryCache: new QueryCache({
          onError(error) {
            if (isUnauthorized(error)) {
              const current = window.location.pathname;
              if (!isPublicPath(current)) {
                window.location.replace(`${ROUTES.LOGIN}?reason=session-expired`);
              }
            }
          },
        }),
      }),
  );

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <JotaiProvider>
          <CartSync />
          {children}
          <AppToaster />
        </JotaiProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
