import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export type Database = NodePgDatabase<typeof schema>;

export interface DbHandle {
  db: Database;
  pool: Pool;
  /** Closes all pooled connections. Call once on shutdown. */
  close: () => Promise<void>;
}

export interface CreateDbOptions {
  /** Maximum pooled connections. */
  max?: number;
}

export function createDb(connectionString: string, { max = 10 }: CreateDbOptions = {}): DbHandle {
  const pool = new Pool({ connectionString, max });
  const db = drizzle(pool, { schema });
  return { db, pool, close: () => pool.end() };
}
