import type { ComponentPropsWithoutRef } from "react";

import { mc } from "@/utils/mc";

/**
 * Props for skeleton placeholders.
 */
export type SkeletonProps = ComponentPropsWithoutRef<"span">;

/**
 * Animated placeholder used while dashboard data loads.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <span
      className={mc("block animate-pulse rounded-md bg-muted-surface", className)}
      {...props}
    />
  );
}

/**
 * Props for table skeleton placeholders.
 */
export type TableSkeletonProps = ComponentPropsWithoutRef<"section"> & {
  columns?: number;
  rows?: number;
};

/**
 * Dense table loading state for inventory and monitoring screens.
 */
export function TableSkeleton({
  className,
  columns = 6,
  rows = 6,
  ...props
}: TableSkeletonProps) {
  const safeColumns = Math.max(columns, 1);
  const safeRows = Math.max(rows, 1);
  const columnItems = Array.from({ length: safeColumns }, (_, index) => index);
  const rowItems = Array.from({ length: safeRows }, (_, index) => index);

  return (
    <section className={mc("ssp-table-scroll", className)} {...props}>
      <table className="ssp-table">
        <thead>
          <tr>
            {columnItems.map((column) => (
              <th key={column}>
                <Skeleton className="h-4 w-24" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowItems.map((row) => (
            <tr key={row}>
              {columnItems.map((column) => (
                <td key={column}>
                  <Skeleton className="h-4 w-full" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
