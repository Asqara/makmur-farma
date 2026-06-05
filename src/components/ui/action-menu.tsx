"use client";

import { MoreHorizontal } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ACTION_MENU_COPY } from "@/constants/design";
import { mc } from "@/utils/mc";

/**
 * Single action item for row and toolbar menus.
 */
export type ActionMenuItem = {
  disabled?: boolean;
  external?: boolean;
  href?: string;
  icon?: ReactNode;
  label: string;
  onSelect?: () => void;
};

/**
 * Props for compact action menus.
 */
export type ActionMenuProps = {
  className?: string;
  items: ActionMenuItem[];
  label?: string;
};

function ActionMenuItemContent({ icon, label }: ActionMenuItem) {
  let iconNode: ReactNode = null;

  if (icon) {
    iconNode = (
      <span aria-hidden="true" className="inline-flex shrink-0 [&>svg]:size-4">
        {icon}
      </span>
    );
  }

  return (
    <>
      {iconNode}
      <span>{label}</span>
    </>
  );
}

/**
 * Portal-based action menu for table row and toolbar actions.
 * Renders panel at document root to escape table overflow contexts.
 */
export function ActionMenu({
  className,
  items,
  label = ACTION_MENU_COPY.label,
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      setPanelStyle({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !panelRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const itemNodes = items.map((item) => {
    const itemClassName = mc(
      "ts-sm flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-text-default transition-colors hover:bg-muted-surface hover:text-text-strong",
      item.disabled && "pointer-events-none text-text-disabled",
    );

    if (item.href && item.external) {
      return (
        <li key={item.label}>
          <a
            aria-disabled={item.disabled}
            className={itemClassName}
            href={item.href}
            onClick={() => setOpen(false)}
            rel="noreferrer"
            target="_blank"
          >
            <ActionMenuItemContent {...item} />
          </a>
        </li>
      );
    }

    if (item.href) {
      return (
        <li key={item.label}>
          <Link
            aria-disabled={item.disabled}
            className={itemClassName}
            href={item.href}
            onClick={() => setOpen(false)}
          >
            <ActionMenuItemContent {...item} />
          </Link>
        </li>
      );
    }

    return (
      <li key={item.label}>
        <button
          className={itemClassName}
          disabled={item.disabled}
          onClick={() => {
            item.onSelect?.();
            setOpen(false);
          }}
          type="button"
        >
          <ActionMenuItemContent {...item} />
        </button>
      </li>
    );
  });

  const panelNode = open
    ? createPortal(
        <ul
          ref={panelRef}
          className="z-60 min-w-44 rounded-lg border border-border-default bg-elevated-surface p-1 shadow-md"
          role="menu"
          style={{ position: "fixed", top: panelStyle.top, right: panelStyle.right }}
        >
          {itemNodes}
        </ul>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={mc(
          "inline-flex size-10 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-muted-surface hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue",
          className,
        )}
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        <MoreHorizontal aria-hidden="true" className="size-4" />
      </button>
      {panelNode}
    </>
  );
}
