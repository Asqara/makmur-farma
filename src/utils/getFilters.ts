type Filters = {
  page: number;
  limit: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  search?: string;
  where: Record<string, unknown>;
};

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const RESERVED = new Set([
  "page",
  "limit",
  "sortBy",
  "sort_by",
  "sortDir",
  "sort_order",
  "search",
]);

/**
 * Parse `searchParams` into a normalized list-query filter object.
 * Use this for any list method instead of parsing parameters by hand.
 */
export function getFilters(searchParams: Record<string, unknown>): Filters {
  const page = Math.max(DEFAULT_PAGE, toInt(searchParams.page, DEFAULT_PAGE));
  const limit = Math.min(MAX_LIMIT, Math.max(1, toInt(searchParams.limit, DEFAULT_LIMIT)));
  const sortBy = toStr(searchParams.sortBy) ?? toStr(searchParams.sort_by);
  const sortDirRaw =
    toStr(searchParams.sortDir) ?? toStr(searchParams.sort_order);
  const sortDir = sortDirRaw === "asc" || sortDirRaw === "desc" ? sortDirRaw : undefined;
  const search = toStr(searchParams.search);

  const where: Record<string, unknown> = {};
  for (const key of Object.keys(searchParams)) {
    if (!RESERVED.has(key)) where[key] = searchParams[key];
  }

  return { page, limit, sortBy, sortDir, search, where };
}

function toInt(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function toStr(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
