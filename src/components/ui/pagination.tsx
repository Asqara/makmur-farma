"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ComponentPropsWithoutRef } from "react";

import { PAGINATION_COPY } from "@/constants/design";
import { mc } from "@/utils/mc";

import { Button } from "./button";

/**
 * Props for pagination controls.
 */
export type PaginationProps = ComponentPropsWithoutRef<"nav"> & {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageCount: number;
};

function getPageNumbers(
  currentPage: number,
  pageCount: number,
): Array<number | "ellipsis-left" | "ellipsis-right"> {
  if (pageCount <= 7) {
    return Array.from({ length: pageCount }, (_, i) => i + 1);
  }

  const pages: Array<number | "ellipsis-left" | "ellipsis-right"> = [1];
  const windowStart = Math.max(2, currentPage - 2);
  const windowEnd = Math.min(pageCount - 1, currentPage + 2);

  if (windowStart > 2) {
    pages.push("ellipsis-left");
  }

  for (let i = windowStart; i <= windowEnd; i++) {
    pages.push(i);
  }

  if (windowEnd < pageCount - 1) {
    pages.push("ellipsis-right");
  }

  pages.push(pageCount);

  return pages;
}

/**
 * Accessible pagination with numbered page buttons and Back/Next controls.
 */
export function Pagination({
  className,
  currentPage,
  onPageChange,
  pageCount,
  ...props
}: PaginationProps) {
  const safePageCount = Math.max(pageCount, 1);
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), safePageCount);
  const canGoPrevious = safeCurrentPage > 1;
  const canGoNext = safeCurrentPage < safePageCount;
  const pages = getPageNumbers(safeCurrentPage, safePageCount);

  const pageNodes = pages.map((page) => {
    if (page === "ellipsis-left" || page === "ellipsis-right") {
      return (
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 items-center justify-center ts-sm text-text-muted"
          key={page}
        >
          ...
        </span>
      );
    }

    const isActive = page === safeCurrentPage;

    return (
      <button
        aria-current={isActive ? "page" : undefined}
        aria-label={`Halaman ${page}`}
        className={mc(
          "ts-sm inline-flex h-10 w-10 items-center justify-center rounded-md border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue focus-visible:ring-offset-2 focus-visible:ring-offset-card-surface",
          isActive
            ? "border-primary-navy bg-primary-navy text-text-inverse"
            : "border-border-default bg-card-surface text-text-strong hover:bg-muted-surface",
        )}
        key={page}
        onClick={() => onPageChange(page)}
        type="button"
      >
        {page}
      </button>
    );
  });

  return (
    <nav
      aria-label={PAGINATION_COPY.label}
      className={mc(
        "flex flex-wrap items-center gap-1",
        className,
      )}
      {...props}
    >
      <Button
        aria-label={PAGINATION_COPY.previous}
        disabled={!canGoPrevious}
        leftIcon={<ChevronLeft />}
        onClick={() => onPageChange(safeCurrentPage - 1)}
        variant="secondary"
      >
        {PAGINATION_COPY.previous}
      </Button>
      {pageNodes}
      <Button
        aria-label={PAGINATION_COPY.next}
        disabled={!canGoNext}
        onClick={() => onPageChange(safeCurrentPage + 1)}
        rightIcon={<ChevronRight />}
        variant="secondary"
      >
        {PAGINATION_COPY.next}
      </Button>
    </nav>
  );
}
