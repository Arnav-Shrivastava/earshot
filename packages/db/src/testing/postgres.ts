import { PostgreSqlContainer, type StartedPostgreSqlContainer } from "@testcontainers/postgresql";

/** Same image the compose stack uses, so tests run against what users run. */
export const TEST_POSTGRES_IMAGE = "pgvector/pgvector:pg16";

/** Starts a throwaway Postgres 16 + pgvector container. Call `.stop()` when done. */
export function startTestPostgres(): Promise<StartedPostgreSqlContainer> {
  return new PostgreSqlContainer(TEST_POSTGRES_IMAGE).start();
}
