import { eq, gte, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setupTestDb, type TestDb } from "../testing/db";
import { pgErrorMessage } from "../testing/errors";
import {
  account,
  apiKeys,
  feedbackItems,
  issues,
  llmUsage,
  replyDrafts,
  session,
  settings,
  sources,
  user,
} from "./index";

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

describe("settings", () => {
  it("creates the single row with safe defaults and no model names or secrets", async () => {
    const [row] = await testDb.db.insert(settings).values({}).returning();
    expect(row).toMatchObject({
      id: 1,
      openaiApiKeyEncrypted: null,
      classifyModel: null,
      embedModel: null,
      draftModel: null,
      monthlyBudgetUsd: null,
      modelPricing: {},
      scoringWeights: {},
      clusterJoinThreshold: expect.closeTo(0.85, 5),
      clusterNewThreshold: expect.closeTo(0.7, 5),
      setupCompletedAt: null,
    });
  });

  it("refuses a second row", async () => {
    await testDb.db.insert(settings).values({});
    expect(await pgErrorMessage(testDb.db.insert(settings).values({}))).toMatch(/duplicate key/);
    expect(await pgErrorMessage(testDb.db.insert(settings).values({ id: 2 }))).toMatch(
      /settings_singleton/,
    );
  });

  it("round-trips budget, model names and pricing", async () => {
    await testDb.db.insert(settings).values({
      monthlyBudgetUsd: 12.5,
      classifyModel: "model-a",
      modelPricing: { "model-a": { inputPerMillion: 0.1, outputPerMillion: 0.4 } },
    });
    const [row] = await testDb.db.select().from(settings);
    expect(row?.monthlyBudgetUsd).toBe(12.5);
    expect(row?.modelPricing["model-a"]).toEqual({ inputPerMillion: 0.1, outputPerMillion: 0.4 });
  });
});

describe("llm_usage", () => {
  it("records a call and keeps cost precision", async () => {
    const [row] = await testDb.db
      .insert(llmUsage)
      .values({
        operation: "classify",
        model: "model-a",
        inputTokens: 1200,
        outputTokens: 300,
        costUsd: 0.000123,
      })
      .returning();
    expect(row).toMatchObject({ success: true, error: null, costUsd: 0.000123 });
  });

  it("sums spend for a period", async () => {
    await testDb.db.insert(llmUsage).values([
      { operation: "classify", model: "m", costUsd: 0.25 },
      { operation: "embed", model: "m", costUsd: 0.5 },
    ]);
    const [total] = await testDb.db
      .select({ total: sql<number>`coalesce(sum(${llmUsage.costUsd}), 0)::float` })
      .from(llmUsage)
      .where(gte(llmUsage.createdAt, new Date(Date.now() - 60_000)));
    expect(total?.total).toBeCloseTo(0.75);
  });

  it("rejects an unknown operation", async () => {
    expect(
      await pgErrorMessage(
        testDb.pool.query("INSERT INTO llm_usage (operation, model) VALUES ('dream', 'm')"),
      ),
    ).toMatch(/invalid input value for enum llm_operation/);
  });
});

describe("reply_drafts", () => {
  async function setup() {
    const [issue] = await testDb.db.insert(issues).values({ title: "Crash" }).returning();
    const [source] = await testDb.db
      .insert(sources)
      .values({ type: "steam", name: "Steam" })
      .returning();
    const [item] = await testDb.db
      .insert(feedbackItems)
      .values({ sourceId: source!.id, contentHash: "h", rawText: "se cierra el juego" })
      .returning();
    return { issue: issue!, item: item! };
  }

  it("stores a draft in the original language with an English reference", async () => {
    const { issue, item } = await setup();
    const [draft] = await testDb.db
      .insert(replyDrafts)
      .values({
        issueId: issue.id,
        feedbackId: item.id,
        language: "es",
        body: "Arreglamos el cierre inesperado.",
        bodyEn: "We fixed the crash.",
        sourceLink: "https://store.steampowered.com/app/1/reviews/2",
      })
      .returning();
    expect(draft).toMatchObject({ status: "draft", sentAt: null, language: "es" });
  });

  it("allows only one draft per issue and feedback item", async () => {
    const { issue, item } = await setup();
    const values = { issueId: issue.id, feedbackId: item.id, language: "es", body: "hola" };
    await testDb.db.insert(replyDrafts).values(values);
    expect(await pgErrorMessage(testDb.db.insert(replyDrafts).values(values))).toMatch(
      /reply_drafts_issue_feedback_unique/,
    );
  });

  it("is removed with its issue", async () => {
    const { issue, item } = await setup();
    await testDb.db
      .insert(replyDrafts)
      .values({ issueId: issue.id, feedbackId: item.id, language: "en", body: "x" });
    await testDb.db.delete(issues).where(eq(issues.id, issue.id));
    expect(await testDb.db.select().from(replyDrafts)).toHaveLength(0);
  });
});

describe("api_keys", () => {
  const base = { name: "Website widget", scope: "widget", prefix: "ek_live_ab" } as const;

  it("stores only a hash and a prefix, with origins as an array", async () => {
    const [key] = await testDb.db
      .insert(apiKeys)
      .values({
        ...base,
        keyHash: "a".repeat(64),
        allowedOrigins: ["https://mygame.com", "https://www.mygame.com"],
      })
      .returning();
    expect(key).toMatchObject({
      revokedAt: null,
      lastUsedAt: null,
      allowedOrigins: ["https://mygame.com", "https://www.mygame.com"],
    });
    expect(Object.keys(key!)).not.toContain("key");
  });

  it("defaults to no allowed origins", async () => {
    const [key] = await testDb.db
      .insert(apiKeys)
      .values({ ...base, scope: "ingest", keyHash: "b".repeat(64) })
      .returning();
    expect(key?.allowedOrigins).toEqual([]);
  });

  it("rejects a duplicate hash and an unknown scope", async () => {
    await testDb.db.insert(apiKeys).values({ ...base, keyHash: "c".repeat(64) });
    expect(
      await pgErrorMessage(testDb.db.insert(apiKeys).values({ ...base, keyHash: "c".repeat(64) })),
    ).toMatch(/duplicate key/);
    expect(
      await pgErrorMessage(
        testDb.pool.query(
          "INSERT INTO api_keys (name, scope, prefix, key_hash) VALUES ('x', 'admin', 'p', 'h')",
        ),
      ),
    ).toMatch(/invalid input value for enum api_key_scope/);
  });
});

describe("auth tables (better-auth)", () => {
  it("enforces a unique email", async () => {
    const owner = { id: "u1", name: "Owner", email: "owner@example.com" };
    await testDb.db.insert(user).values(owner);
    expect(await pgErrorMessage(testDb.db.insert(user).values({ ...owner, id: "u2" }))).toMatch(
      /duplicate key/,
    );
  });

  it("removes sessions and accounts when the user is deleted", async () => {
    await testDb.db.insert(user).values({ id: "u1", name: "Owner", email: "o@example.com" });
    await testDb.db.insert(session).values({
      id: "s1",
      userId: "u1",
      token: "tok",
      expiresAt: new Date(Date.now() + 3_600_000),
    });
    await testDb.db
      .insert(account)
      .values({ id: "a1", userId: "u1", accountId: "u1", providerId: "credential", password: "x" });

    await testDb.db.delete(user).where(eq(user.id, "u1"));

    expect(await testDb.db.select().from(session)).toHaveLength(0);
    expect(await testDb.db.select().from(account)).toHaveLength(0);
  });
});
