import "server-only";

import { and, asc, desc, eq } from "drizzle-orm";

import { customerProfiles, users } from "@/drizzle-schema";
import { readDb } from "@/lib/db";
import { NotFoundAppError } from "@/lib/errors";

import {
  buildPagination,
  buildTextSearch,
  combineConditions,
  countSql,
  getListFilters,
  toString,
  type ListResponse,
} from "./list-utils";

const CUSTOMER_SORT_FIELDS = {
  createdAt: users.createdAt,
  email: users.email,
  name: users.fullName,
  status: users.status,
} as const;

export type CustomerListItem = {
  createdAt: Date;
  emailMasked: string;
  emailVerifiedAt: Date | null;
  id: string;
  name: string;
  phone: string | null;
  status: string;
};

export type CustomerDetail = CustomerListItem & {
  address: {
    addressLine: string | null;
    city: string | null;
    postalCode: string | null;
    province: string | null;
  };
  email: string;
};

function maskEmail(email: string) {
  const [name, domain] = email.split("@");

  if (!name || !domain) return "email terdaftar";

  return `${name.slice(0, 2)}${"*".repeat(Math.max(name.length - 2, 2))}@${domain}`;
}

/**
 * Customer query service backed by users plus optional customer profile.
 */
export class CustomersClient {
  async list(searchParams: Record<string, unknown>): Promise<ListResponse<CustomerListItem>> {
    const filters = getListFilters(searchParams);
    const status = toString(filters.where.status);
    const conditions = [eq(users.role, "CUSTOMER")];
    const searchCondition = buildTextSearch(filters.search, [
      users.fullName,
      users.email,
      users.phone,
    ]);

    if (status) conditions.push(eq(users.status, status as never));
    if (searchCondition) conditions.push(searchCondition);

    const whereClause = combineConditions(conditions);
    const sortBy =
      filters.sortBy && filters.sortBy in CUSTOMER_SORT_FIELDS
        ? filters.sortBy
        : "createdAt";
    const sortColumn =
      CUSTOMER_SORT_FIELDS[sortBy as keyof typeof CUSTOMER_SORT_FIELDS];
    const orderBy = filters.sortDir === "asc" ? asc(sortColumn) : desc(sortColumn);
    const offset = (filters.page - 1) * filters.limit;

    let countQuery = readDb.select({ total: countSql() }).from(users).$dynamic();
    if (whereClause) countQuery = countQuery.where(whereClause);
    const [countRow] = await countQuery;
    const total = Number(countRow?.total ?? 0);

    let listQuery = readDb
      .select({
        createdAt: users.createdAt,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        id: users.id,
        name: users.fullName,
        phone: users.phone,
        status: users.status,
      })
      .from(users)
      .orderBy(orderBy)
      .limit(filters.limit)
      .offset(offset)
      .$dynamic();
    if (whereClause) listQuery = listQuery.where(whereClause);
    const rows = await listQuery;

    return {
      data: rows.map((row) => ({
        createdAt: row.createdAt,
        emailMasked: maskEmail(row.email),
        emailVerifiedAt: row.emailVerifiedAt ?? null,
        id: row.id,
        name: row.name,
        phone: row.phone ?? null,
        status: row.status,
      })),
      pagination: buildPagination(total, filters.page, filters.limit),
    };
  }

  async get(id: string): Promise<CustomerDetail> {
    const [customer] = await readDb
      .select({
        addressLine: customerProfiles.addressLine,
        city: customerProfiles.city,
        createdAt: users.createdAt,
        email: users.email,
        emailVerifiedAt: users.emailVerifiedAt,
        id: users.id,
        name: users.fullName,
        phone: users.phone,
        postalCode: customerProfiles.postalCode,
        province: customerProfiles.province,
        status: users.status,
      })
      .from(users)
      .leftJoin(customerProfiles, eq(customerProfiles.userId, users.id))
      .where(and(eq(users.id, id), eq(users.role, "CUSTOMER")))
      .limit(1);

    if (!customer) {
      throw new NotFoundAppError("Pelanggan tidak ditemukan.");
    }

    return {
      address: {
        addressLine: customer.addressLine ?? null,
        city: customer.city ?? null,
        postalCode: customer.postalCode ?? null,
        province: customer.province ?? null,
      },
      createdAt: customer.createdAt,
      email: customer.email,
      emailMasked: maskEmail(customer.email),
      emailVerifiedAt: customer.emailVerifiedAt ?? null,
      id: customer.id,
      name: customer.name,
      phone: customer.phone ?? null,
      status: customer.status,
    };
  }
}
