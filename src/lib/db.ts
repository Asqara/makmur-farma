import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { ENV } from "@/constants/config";
import * as schema from "@/drizzle-schema";

const writeClient = postgres(ENV.databaseUrl, {
  max: 10,
  prepare: false,
});

const readClient = postgres(ENV.databaseReadUrl, {
  max: 10,
  prepare: false,
});

/**
 * Authoritative write database connection.
 */
export const db = drizzle(writeClient, { schema });

/**
 * Read database connection for non-mutating queries.
 */
export const readDb = drizzle(readClient, { schema });

export type DatabaseClient = typeof db;
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
