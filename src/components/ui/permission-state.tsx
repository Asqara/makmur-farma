import { ShieldOff } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { mc } from "@/utils/mc";

import { ButtonLink } from "./button";

/**
 * Props for the permission-denied state.
 */
export type PermissionStateProps = ComponentPropsWithoutRef<"section"> & {
  backHref?: string;
  backLabel?: string;
  description?: string;
  title?: string;
};

/**
 * Full-area state shown when the current user lacks access to a page or resource.
 * Always provide a safe navigation action so users can return to a known location.
 */
export function PermissionState({
  backHref = "/dashboard",
  backLabel = "Kembali ke Dashboard",
  className,
  description = "Hubungi administrator jika akses ini diperlukan untuk pekerjaan Anda.",
  title = "Anda tidak memiliki akses ke halaman ini.",
  ...props
}: PermissionStateProps) {
  return (
    <section
      className={mc(
        "grid justify-items-center gap-4 rounded-xl border border-border-default bg-card-surface px-6 py-12 text-center",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-14 items-center justify-center rounded-full bg-muted-surface text-text-muted [&>svg]:size-7"
      >
        <ShieldOff />
      </span>
      <header className="grid gap-2">
        <h2 className="ts-lg font-semibold text-text-strong">{title}</h2>
        <p className="ts-sm max-w-sm text-text-muted">{description}</p>
      </header>
      <ButtonLink href={backHref} variant="secondary">
        {backLabel}
      </ButtonLink>
    </section>
  );
}
