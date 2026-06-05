"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { EMPTY_STATE_COPY } from "@/constants/design";
import { mc } from "@/utils/mc";

import { Button, ButtonLink } from "./button";

/**
 * Props for empty states.
 */
export type EmptyStateProps = ComponentPropsWithoutRef<"section"> & {
  actionHref?: string;
  actionLabel?: string;
  description?: string;
  icon?: ReactNode;
  onAction?: () => void;
  title?: string;
};

/**
 * Useful empty state with optional action.
 */
export function EmptyState({
  actionHref,
  actionLabel = EMPTY_STATE_COPY.actionLabel,
  className,
  description = EMPTY_STATE_COPY.description,
  icon,
  onAction,
  title = EMPTY_STATE_COPY.title,
  ...props
}: EmptyStateProps) {
  let iconNode: ReactNode = null;

  if (icon) {
    iconNode = (
      <span
        aria-hidden="true"
        className="inline-flex size-12 items-center justify-center rounded-full bg-muted-surface text-text-muted [&>svg]:size-8"
      >
        {icon}
      </span>
    );
  }

  let actionNode: ReactNode = null;

  if (actionHref) {
    actionNode = <ButtonLink href={actionHref}>{actionLabel}</ButtonLink>;
  } else if (onAction) {
    actionNode = <Button onClick={onAction}>{actionLabel}</Button>;
  }

  return (
    <section
      className={mc(
        "grid justify-items-center gap-3 rounded-xl border border-dashed border-border-default bg-card-surface px-6 py-10 text-center",
        className,
      )}
      {...props}
    >
      {iconNode}
      <header className="grid gap-1">
        <h2 className="ts-lg font-semibold text-text-strong">{title}</h2>
        <p className="ts-sm max-w-md text-text-muted">{description}</p>
      </header>
      {actionNode}
    </section>
  );
}
