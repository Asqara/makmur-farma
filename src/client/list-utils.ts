import { and, ilike, or, sql, type SQL } from "drizzle-orm";

import { getFilters } from "@/utils/getFilters";

export type Pagination = {
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

export type ListResponse<T> = {
  data: T[];
  pagination: Pagination;
};

export function buildPagination(
  total: number,
  page: number,
  limit: number,
): Pagination {
  return {
    limit,
    page,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

export function escapeLike(value: string) {
  return value.replace(/[%_]/g, "\\$&");
}

export function toString(value: unknown) {
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

export function toBooleanString(value: unknown) {
  const text = toString(value);

  if (text === "true") return true;
  if (text === "false") return false;

  return undefined;
}

export function getListFilters(searchParams: Record<string, unknown>) {
  return getFilters(searchParams);
}

export function combineConditions(conditions: SQL<unknown>[]) {
  return conditions.length ? and(...conditions) : undefined;
}

export function buildTextSearch(
  search: string | undefined,
  columns: Array<Parameters<typeof ilike>[0]>,
) {
  if (!search) return undefined;

  const pattern = `%${escapeLike(search)}%`;

  return or(...columns.map((column) => ilike(column, pattern)));
}

export function countSql() {
  return sql<number>`count(*)`;
}
