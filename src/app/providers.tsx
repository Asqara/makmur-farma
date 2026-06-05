"use client";

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider as JotaiProvider } from "jotai";
import { HelmetProvider } from "react-helmet-async";
import { useState } from "react";

import { AppToaster } from "@/components/ui/app-toaster";
import { ROUTES } from "@/constants/routes";

type ProvidersProps = {
  children: React.ReactNode;
};

function isUnauthorized(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return (error as Record<string, unknown>).status === 401;
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
              const publicPaths = [ROUTES.LOGIN, ROUTES.REGISTER, ROUTES.VERIFY_EMAIL, ROUTES.CHECK_EMAIL];
              if (!publicPaths.some((p) => current.startsWith(p))) {
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
          {children}
          <AppToaster />
        </JotaiProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
