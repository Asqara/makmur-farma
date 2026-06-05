"use client";

import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { TABS_COPY } from "@/constants/design";
import { mc } from "@/utils/mc";

/**
 * Single tab item.
 */
export type TabItem = {
  disabled?: boolean;
  label: string;
  panel: ReactNode;
  value: string;
};

/**
 * Props for controlled tabs.
 */
export type TabsProps = Omit<ComponentPropsWithoutRef<"section">, "children"> & {
  items: TabItem[];
  onValueChange: (value: string) => void;
  value: string;
};

/**
 * Controlled tabs for reports, detail pages, and operational views.
 */
export function Tabs({
  className,
  items,
  onValueChange,
  value,
  ...props
}: TabsProps) {
  const activeItem = items.find((item) => item.value === value) ?? items[0];

  if (!activeItem) {
    return null;
  }

  return (
    <section className={mc("grid gap-4", className)} {...props}>
      <section
        aria-label={TABS_COPY.label}
        className="flex gap-1 overflow-x-auto rounded-lg bg-muted-surface p-1"
        role="tablist"
      >
        {items.map((item) => {
          const isActive = item.value === activeItem.value;

          return (
            <button
              aria-selected={isActive}
              className={mc(
                "ts-sm min-h-10 rounded-md px-4 font-medium text-text-muted transition-colors hover:bg-card-surface hover:text-text-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue",
                isActive && "bg-card-surface text-text-strong shadow-sm",
              )}
              disabled={item.disabled}
              key={item.value}
              onClick={() => onValueChange(item.value)}
              role="tab"
              type="button"
            >
              {item.label}
            </button>
          );
        })}
      </section>
      <section
        aria-label={activeItem.label}
        className="min-w-0"
        role="tabpanel"
      >
        {activeItem.panel}
      </section>
    </section>
  );
}
