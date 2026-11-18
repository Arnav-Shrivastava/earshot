import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDb } from "./client";
import { runMigrations } from "./migrate";
import { startTestPostgres } from "./testing/postgres";

describe("migrations (real Postgres 16 + pgvector)", () => {
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    container = await startTestPostgres();
  });

  afterAll(async () => {
    await container?.stop();
  });

  async function query<T extends Record<string, unknown>>(sql: string): Promise<T[]> {
    const { pool, close } = createDb(container.getConnectionUri(), { max: 1 });
    try {
      return (await pool.query<T>(sql)).rows;
    } finally {
      await close();
    }
  }

  it("creates the vector extension on a fresh database", async () => {
    expect(await query("SELECT 1 FROM pg_extension WHERE extname = 'vector'")).toHaveLength(0);

    await runMigrations(container.getConnectionUri());

    expect(await query("SELECT 1 FROM pg_extension WHERE extname = 'vector'")).toHaveLength(1);
  });

  it("is idempotent: running twice does not fail or duplicate history", async () => {
    await runMigrations(container.getConnectionUri());
    await runMigrations(container.getConnectionUri());

    const applied = await query("SELECT id FROM drizzle.__drizzle_migrations");
    expect(applied).toHaveLength(1);
  });

  it("can store and query a vector once migrated", async () => {
    const rows = await query<{ distance: number }>(
      "SELECT '[1,0,0]'::vector <=> '[0,1,0]'::vector AS distance",
    );
    expect(Number(rows[0]?.distance)).toBeCloseTo(1);
  });

  it("fails clearly on an unreachable database", async () => {
    await expect(runMigrations("postgres://nobody:nope@127.0.0.1:1/none")).rejects.toThrow();
  });
});
