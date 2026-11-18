import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createDb } from "./client";

/** Folder with the generated SQL migrations and drizzle's meta journal. */
export const DEFAULT_MIGRATIONS_FOLDER = fileURLToPath(new URL("../drizzle", import.meta.url));

export interface RunMigrationsOptions {
  migrationsFolder?: string;
}

/**
 * Applies all pending migrations. Safe to run repeatedly and from several
 * processes: drizzle records applied migrations in `drizzle.__drizzle_migrations`.
 */
export async function runMigrations(
  connectionString: string,
  { migrationsFolder = DEFAULT_MIGRATIONS_FOLDER }: RunMigrationsOptions = {},
): Promise<void> {
  const { db, close } = createDb(connectionString, { max: 1 });
  try {
    await migrate(db, { migrationsFolder });
  } finally {
    await close();
  }
}
