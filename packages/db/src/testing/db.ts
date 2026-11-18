import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";

import { createDb, type DbHandle } from "../client";
import { runMigrations } from "../migrate";
import { startTestPostgres } from "./postgres";

export interface TestDb extends DbHandle {
  container: StartedPostgreSqlContainer;
  connectionString: string;
  /** Removes all rows from every table in the public schema. */
  reset: () => Promise<void>;
  stop: () => Promise<void>;
}

/** Starts Postgres, applies all migrations and returns a connected handle. */
export async function setupTestDb(): Promise<TestDb> {
  const container = await startTestPostgres();
  const connectionString = container.getConnectionUri();
  await runMigrations(connectionString);
  const handle = createDb(connectionString);

  return {
    ...handle,
    container,
    connectionString,
    async reset() {
      const { rows } = await handle.pool.query<{ tablename: string }>(
        "SELECT tablename FROM pg_tables WHERE schemaname = 'public'",
      );
      if (rows.length === 0) return;
      const names = rows.map((row) => `"${row.tablename}"`).join(", ");
      await handle.pool.query(`TRUNCATE ${names} RESTART IDENTITY CASCADE`);
    },
    async stop() {
      await handle.close();
      await container.stop();
    },
  };
}
