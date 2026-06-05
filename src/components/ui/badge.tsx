import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { STATUS_TONE_CLASS_NAMES } from "@/constants/design";
import { mc } from "@/utils/mc";

const badgeClassNames = cva(
  "ts-xs inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5 py-1 font-medium",
  {
    defaultVariants: {
      tone: "neutral",
    },
    variants: {
      tone: STATUS_TONE_CLASS_NAMES,
    },
  },
);

/**
 * Props for compact status and metadata badges.
 */
export type BadgeProps = ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badgeClassNames> & {
    showDot?: boolean;
  };

/**
 * Compact badge for operational status, severity, and metadata.
 */
export function Badge({
  children,
  className,
  showDot = false,
  tone,
  ...props
}: BadgeProps) {
  let dotNode: ReactNode = null;

  if (showDot) {
    dotNode = <span aria-hidden="true" className="ssp-status-dot bg-current" />;
  }

  return (
    <span className={mc(badgeClassNames({ tone }), className)} {...props}>
      {dotNode}
      {children}
    </span>
  );
}
