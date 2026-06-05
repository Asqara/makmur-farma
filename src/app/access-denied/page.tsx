import { PermissionState } from "@/components/ui";
import { ROUTES } from "@/constants/routes";

/**
 * Dedicated permission-denied page.
 */
export default function AccessDeniedPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-page-background p-6">
      <PermissionState backHref={ROUTES.DASHBOARD} />
    </main>
  );
}
