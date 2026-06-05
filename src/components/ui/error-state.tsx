"use client";

import { AlertTriangle } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { ERROR_STATE_COPY } from "@/constants/design";
import { mc } from "@/utils/mc";

import { Button } from "./button";

/**
 * Props for recoverable error states.
 */
export type ErrorStateProps = ComponentPropsWithoutRef<"section"> & {
  actionLabel?: string;
  description?: string;
  onRetry?: () => void;
  title?: string;
};

/**
 * Error state with short copy and optional retry action.
 */
export function ErrorState({
  actionLabel = ERROR_STATE_COPY.actionLabel,
  className,
  description = ERROR_STATE_COPY.description,
  onRetry,
  title = ERROR_STATE_COPY.title,
  ...props
}: ErrorStateProps) {
  let actionNode: ReactNode = null;

  if (onRetry) {
    actionNode = (
      <Button onClick={onRetry} variant="secondary">
        {actionLabel}
      </Button>
    );
  }

  return (
    <section
      className={mc(
        "grid justify-items-center gap-3 rounded-xl border border-danger-border bg-danger-bg px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="inline-flex size-12 items-center justify-center rounded-full bg-card-surface text-danger [&>svg]:size-8"
      >
        <AlertTriangle />
      </span>
      <header className="grid gap-1">
        <h2 className="ts-lg font-semibold text-text-strong">{title}</h2>
        <p className="ts-sm max-w-md text-text-default">{description}</p>
      </header>
      {actionNode}
    </section>
  );
}
