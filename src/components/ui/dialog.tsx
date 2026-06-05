"use client";

import { AlertTriangle, Info, Loader2, X } from "lucide-react";
import type { ReactNode } from "react";

import { DIALOG_COPY } from "@/constants/design";
import { mc } from "@/utils/mc";

import { Button } from "./button";

/**
 * Props for focused confirmation and short-action dialogs.
 */
export type DialogProps = {
  children: ReactNode;
  className?: string;
  description?: string;
  footer?: ReactNode;
  id: string;
  onClose?: () => void;
  open: boolean;
  title: string;
};

/**
 * Controlled dialog for confirmation and short focused actions.
 */
export function Dialog({
  children,
  className,
  description,
  footer,
  id,
  onClose,
  open,
  title,
}: DialogProps) {
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;

  let descriptionNode: ReactNode = null;

  if (description) {
    descriptionNode = (
      <p className="ts-sm text-text-muted" id={descriptionId}>
        {description}
      </p>
    );
  }

  let closeNode: ReactNode = null;

  if (onClose) {
    closeNode = (
      <Button
        aria-label={DIALOG_COPY.close}
        onClick={onClose}
        size="icon"
        variant="ghost"
      >
        <X />
      </Button>
    );
  }

  let footerNode: ReactNode = null;

  if (footer) {
    footerNode = (
      <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-border-default px-4 py-4 sm:px-6">
        {footer}
      </footer>
    );
  }

  const ariaDescription = description ? descriptionId : undefined;

  if (!open) {
    return null;
  }

  return (
    <section className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-primary-navy/50 p-3 sm:p-4">
      <section
        aria-describedby={ariaDescription}
        aria-labelledby={titleId}
        aria-modal="true"
        className={mc(
          "max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-xl border border-border-default bg-card-surface shadow-lg",
          className,
        )}
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border-default px-4 py-4 sm:px-6">
          <section className="grid gap-1">
            <h2 className="ts-lg font-semibold text-text-strong" id={titleId}>
              {title}
            </h2>
            {descriptionNode}
          </section>
          {closeNode}
        </header>
        <section className="grid gap-4 p-4 sm:p-6">{children}</section>
        {footerNode}
      </section>
    </section>
  );
}

const CONFIRM_VARIANT_ICONS = {
  danger: AlertTriangle,
  info: Info,
  warning: AlertTriangle,
} as const;

const CONFIRM_VARIANT_ICON_CLASS = {
  danger: "text-danger bg-danger-bg",
  info: "text-info bg-info-bg",
  warning: "text-warning bg-warning-bg",
} as const;

const CONFIRM_VARIANT_BUTTON = {
  danger: "danger",
  info: "primary",
  warning: "danger",
} as const;

/**
 * Confirm dialog variant that controls icon color and confirm button style.
 */
export type ConfirmDialogVariant = keyof typeof CONFIRM_VARIANT_ICONS;

/**
 * Props for variant-aware confirmation dialogs.
 */
export type ConfirmDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  description: string;
  id: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  variant?: ConfirmDialogVariant;
};

/**
 * Confirmation dialog with danger, warning, and info variants.
 * Use for logout, delete, cancel transfer, rollback, and other destructive or irreversible actions.
 */
export function ConfirmDialog({
  cancelLabel = DIALOG_COPY.cancel,
  confirmLabel = DIALOG_COPY.confirm,
  description,
  id,
  loading,
  onCancel,
  onConfirm,
  open,
  title,
  variant = "info",
}: ConfirmDialogProps) {
  const Icon = CONFIRM_VARIANT_ICONS[variant];
  const iconClass = CONFIRM_VARIANT_ICON_CLASS[variant];
  const buttonVariant = CONFIRM_VARIANT_BUTTON[variant];

  return (
    <Dialog
      footer={
        <>
          <Button disabled={loading} onClick={onCancel} variant="secondary">
            {cancelLabel}
          </Button>
          <Button
            disabled={loading}
            leftIcon={loading ? <Loader2 className="animate-spin" /> : undefined}
            onClick={onConfirm}
            variant={buttonVariant}
          >
            {confirmLabel}
          </Button>
        </>
      }
      id={id}
      onClose={onCancel}
      open={open}
      title={title}
    >
      <article className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className={mc(
            "grid size-10 shrink-0 place-items-center rounded-full",
            iconClass,
          )}
        >
          <Icon className="size-5" />
        </span>
        <p className="ts-sm text-text-default">{description}</p>
      </article>
    </Dialog>
  );
}
