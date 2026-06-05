import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { mc } from "@/utils/mc";

/**
 * Props for table page shells.
 */
export type DataTableShellProps = ComponentPropsWithoutRef<"section"> & {
  description?: string;
  footer?: ReactNode;
  title: string;
  toolbar?: ReactNode;
};

/**
 * Table shell with title, helper copy, toolbar, content, and pagination slot.
 */
export function DataTableShell({
  children,
  className,
  description,
  footer,
  title,
  toolbar,
  ...props
}: DataTableShellProps) {
  let descriptionNode: ReactNode = null;

  if (description) {
    descriptionNode = <p className="ts-sm text-text-muted">{description}</p>;
  }

  let toolbarNode: ReactNode = null;

  if (toolbar) {
    toolbarNode = <section className="ssp-filter-bar">{toolbar}</section>;
  }

  let footerNode: ReactNode = null;

  if (footer) {
    footerNode = <footer>{footer}</footer>;
  }

  return (
    <section className={mc("grid gap-4", className)} {...props}>
      <header className="grid min-w-0 gap-3">
        <section className="grid min-w-0 gap-1">
          <h2 className="ts-xl font-semibold text-text-strong">{title}</h2>
          {descriptionNode}
        </section>
        {toolbarNode}
      </header>
      {children}
      {footerNode}
    </section>
  );
}

/**
 * Props for semantic dashboard tables.
 */
export type DataTableProps = ComponentPropsWithoutRef<"table"> & {
  dense?: boolean;
};

/**
 * Scroll-safe table container for data-heavy screens.
 */
export function DataTable({
  className,
  dense = false,
  ...props
}: DataTableProps) {
  return (
    <section className="ssp-table-scroll">
      <table
        className={mc("ssp-table ts-sm", dense && "ssp-table-dense", className)}
        {...props}
      />
    </section>
  );
}

/**
 * Props for table headers.
 */
export type TableHeaderProps = ComponentPropsWithoutRef<"thead">;

/**
 * Semantic table header.
 */
export function TableHeader({ className, ...props }: TableHeaderProps) {
  return <thead className={className} {...props} />;
}

/**
 * Props for table body.
 */
export type TableBodyProps = ComponentPropsWithoutRef<"tbody">;

/**
 * Semantic table body.
 */
export function TableBody({ className, ...props }: TableBodyProps) {
  return <tbody className={className} {...props} />;
}

/**
 * Props for table rows.
 */
export type TableRowProps = ComponentPropsWithoutRef<"tr">;

/**
 * Semantic table row.
 */
export function TableRow({ className, ...props }: TableRowProps) {
  return (
    <tr
      className={mc("transition-colors hover:bg-muted-surface/60", className)}
      {...props}
    />
  );
}

/**
 * Props for table head cells.
 */
export type TableHeadProps = ComponentPropsWithoutRef<"th">;

/**
 * Header cell for dashboard tables.
 */
export function TableHead({
  className,
  scope = "col",
  ...props
}: TableHeadProps) {
  return <th className={className} scope={scope} {...props} />;
}

/**
 * Props for table cells.
 */
export type TableCellProps = ComponentPropsWithoutRef<"td">;

/**
 * Body cell for dashboard tables.
 */
export function TableCell({ className, ...props }: TableCellProps) {
  return <td className={className} {...props} />;
}

/**
 * Props for table captions.
 */
export type TableCaptionProps = ComponentPropsWithoutRef<"caption">;

/**
 * Accessible table caption.
 */
export function TableCaption({ className, ...props }: TableCaptionProps) {
  return (
    <caption
      className={mc("ts-sm p-4 text-left text-text-muted", className)}
      {...props}
    />
  );
}
