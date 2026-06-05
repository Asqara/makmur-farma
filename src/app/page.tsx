"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROUTES } from "@/constants/routes";

/**
 * Root page redirects to dashboard.
 */
export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.DASHBOARD);
  }, [router]);

  return null;
}
