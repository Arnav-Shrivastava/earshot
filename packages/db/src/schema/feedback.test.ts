import { EMBEDDING_DIMENSIONS } from "@earshot/core";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setupTestDb, type TestDb } from "../testing/db";
import { pgErrorMessage } from "../testing/errors";
import { feedbackItems, sources } from "./index";

let testDb: TestDb;

beforeAll(async () => {
  testDb = await setupTestDb();
});

afterAll(async () => {
  await testDb?.stop();
});

beforeEach(async () => {
  await testDb.reset();
});

async function makeSource(name = "Steam reviews") {
  const [source] = await testDb.db.insert(sources).values({ type: "steam", name }).returning();
  if (!source) throw new Error("source not inserted");
  return source;
}

const item = (sourceId: string, overrides: Partial<typeof feedbackItems.$inferInsert> = {}) => ({
  sourceId,
  contentHash: "hash-1",
  rawText: "The game crashes when I open the map",
  ...overrides,
});

describe("sources", () => {
  it("applies sensible defaults", async () => {
    const source = await makeSource();
    expect(source.status).toBe("active");
    expect(source.config).toEqual({});
    expect(source.secretsEncrypted).toBeNull();
    expect(source.syncCursor).toBeNull();
    expect(source.createdAt).toBeInstanceOf(Date);
  });

  it("stores config and cursor as JSON", async () => {
    const [source] = await testDb.db
      .insert(sources)
      .values({
        type: "email",
        name: "Support inbox",
        config: { folder: "INBOX" },
        syncCursor: { uidValidity: 7, lastUid: 42 },
      })
      .returning();
    expect(source?.config).toEqual({ folder: "INBOX" });
    expect(source?.syncCursor).toEqual({ uidValidity: 7, lastUid: 42 });
  });

  it("rejects an unknown source type", async () => {
    await expect(
      testDb.pool.query("INSERT INTO sources (type, name) VALUES ('fax', 'x')"),
    ).rejects.toThrow(/invalid input value for enum/);
  });
});

describe("feedback_items", () => {
  it("inserts with pipeline defaults and no classification yet", async () => {
    const source = await makeSource();
    const [row] = await testDb.db.insert(feedbackItems).values(item(source.id)).returning();
    expect(row).toMatchObject({
      pipelineStatus: "pending",
      pipelineAttempts: 0,
      authorIsPaying: false,
      metadata: {},
      type: null,
      severity: null,
      sentiment: null,
      embedding: null,
    });
  });

  it("rejects a duplicate (source, external id) but allows the same id in another source", async () => {
    const a = await makeSource("A");
    const b = await makeSource("B");
    await testDb.db.insert(feedbackItems).values(item(a.id, { externalId: "r1" }));

    await expect(
      testDb.db.insert(feedbackItems).values(item(a.id, { externalId: "r1", contentHash: "h2" })),
    ).rejects.toThrow();
    await expect(
      testDb.db.insert(feedbackItems).values(item(b.id, { externalId: "r1" })),
    ).resolves.toBeDefined();
  });

  it("allows many rows with no external id (CSV, widget)", async () => {
    const source = await makeSource();
    await testDb.db
      .insert(feedbackItems)
      .values([item(source.id, { contentHash: "h1" }), item(source.id, { contentHash: "h2" })]);
    const rows = await testDb.db.select().from(feedbackItems);
    expect(rows).toHaveLength(2);
  });

  it("has an index on content_hash", async () => {
    const { rows } = await testDb.pool.query(
      "SELECT 1 FROM pg_indexes WHERE tablename = 'feedback_items' AND indexname = 'feedback_content_hash_idx'",
    );
    expect(rows).toHaveLength(1);
  });

  it("deletes feedback when its source is deleted", async () => {
    const source = await makeSource();
    await testDb.db.insert(feedbackItems).values(item(source.id));
    await testDb.db.delete(sources).where(eq(sources.id, source.id));
    expect(await testDb.db.select().from(feedbackItems)).toHaveLength(0);
  });

  it("rejects an item that points at a missing source", async () => {
    await expect(
      testDb.db.insert(feedbackItems).values(item("00000000-0000-0000-0000-000000000000")),
    ).rejects.toThrow();
  });

  it("round-trips classification fields", async () => {
    const source = await makeSource();
    const [row] = await testDb.db
      .insert(feedbackItems)
      .values(
        item(source.id, {
          type: "bug",
          severity: "high",
          sentiment: "negative",
          language: "pt-BR",
          summaryEn: "Crash when opening the map",
          pipelineStatus: "classified",
        }),
      )
      .returning();
    expect(row).toMatchObject({ type: "bug", severity: "high", language: "pt-BR" });
  });

  it("rejects values outside the classification enums", async () => {
    const source = await makeSource();
    await expect(
      testDb.pool.query(
        "INSERT INTO feedback_items (source_id, content_hash, raw_text, severity) VALUES ($1, 'h', 't', 'apocalyptic')",
        [source.id],
      ),
    ).rejects.toThrow(/invalid input value for enum/);
  });

  describe("embedding", () => {
    const vectorOf = (value: number) => Array.from({ length: EMBEDDING_DIMENSIONS }, () => value);

    it("round-trips a 512-dimension vector", async () => {
      const source = await makeSource();
      const embedding = vectorOf(0.5);
      const [row] = await testDb.db
        .insert(feedbackItems)
        .values(item(source.id, { embedding }))
        .returning();
      expect(row?.embedding).toHaveLength(EMBEDDING_DIMENSIONS);
      expect(row?.embedding?.[0]).toBeCloseTo(0.5);
    });

    it("rejects a vector with the wrong number of dimensions", async () => {
      const source = await makeSource();
      expect(
        await pgErrorMessage(
          testDb.db.insert(feedbackItems).values(item(source.id, { embedding: [1, 2, 3] })),
        ),
      ).toMatch(/expected 512 dimensions, not 3/);
    });

    it("finds the nearest neighbour by cosine distance", async () => {
      const source = await makeSource();
      const near = [1, ...Array.from({ length: EMBEDDING_DIMENSIONS - 1 }, () => 0)];
      const far = [0, 1, ...Array.from({ length: EMBEDDING_DIMENSIONS - 2 }, () => 0)];
      await testDb.db
        .insert(feedbackItems)
        .values([
          item(source.id, { contentHash: "near", rawText: "near", embedding: near }),
          item(source.id, { contentHash: "far", rawText: "far", embedding: far }),
        ]);

      const query = `[${near.join(",")}]`;
      const rows = await testDb.db
        .select({ rawText: feedbackItems.rawText })
        .from(feedbackItems)
        .orderBy(sql`${feedbackItems.embedding} <=> ${query}::vector`)
        .limit(1);
      expect(rows[0]?.rawText).toBe("near");
    });
  });
});
