import { EMBEDDING_DIMENSIONS } from "@earshot/core";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setupTestDb, type TestDb } from "../testing/db";
import { pgErrorMessage } from "../testing/errors";
import {
  feedbackItems,
  ISSUE_STATUSES,
  issueEvents,
  issueFeedback,
  issues,
  notes,
  sources,
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

async function makeIssue(overrides: Partial<typeof issues.$inferInsert> = {}) {
  const [issue] = await testDb.db
    .insert(issues)
    .values({ title: "Crash on map open", ...overrides })
    .returning();
  if (!issue) throw new Error("issue not inserted");
  return issue;
}

async function makeFeedback(hash = "h1") {
  const [source] = await testDb.db
    .insert(sources)
    .values({ type: "steam", name: "Steam" })
    .onConflictDoNothing()
    .returning();
  const sourceId =
    source?.id ?? (await testDb.db.select().from(sources).limit(1))[0]?.id ?? "missing";
  const [item] = await testDb.db
    .insert(feedbackItems)
    .values({ sourceId, contentHash: hash, rawText: `text ${hash}` })
    .returning();
  if (!item) throw new Error("feedback not inserted");
  return item;
}

const unit = (index: number) =>
  Array.from({ length: EMBEDDING_DIMENSIONS }, (_, i) => (i === index ? 1 : 0));

describe("issues", () => {
  it("starts in triage with medium priority, unassigned and unscored", async () => {
    const issue = await makeIssue();
    expect(issue).toMatchObject({
      status: "triage",
      priority: "medium",
      assignee: null,
      mentionCount: 0,
      score: 0,
      scoreBreakdown: {},
      centroid: null,
      summary: "",
    });
  });

  it("covers the four board columns in order", () => {
    expect(ISSUE_STATUSES).toEqual(["triage", "planned", "in_progress", "shipped"]);
  });

  it.each(ISSUE_STATUSES)("accepts status %s", async (status) => {
    const issue = await makeIssue({ status });
    expect(issue.status).toBe(status);
  });

  it("rejects an unknown status", async () => {
    expect(
      await pgErrorMessage(
        testDb.pool.query("INSERT INTO issues (title, status) VALUES ('x', 'done')"),
      ),
    ).toMatch(/invalid input value for enum issue_status/);
  });

  it("stores a score breakdown as JSON", async () => {
    const issue = await makeIssue({
      score: 7.5,
      scoreBreakdown: { mentions: 3, recency: 2, severity: 2.5 },
      scoreReason: "Mentioned 12 times, 5 in the last week",
    });
    expect(issue.scoreBreakdown).toEqual({ mentions: 3, recency: 2, severity: 2.5 });
  });

  it("has an HNSW index on the centroid and finds the nearest issue", async () => {
    const { rows } = await testDb.pool.query(
      "SELECT indexdef FROM pg_indexes WHERE indexname = 'issues_centroid_hnsw_idx'",
    );
    expect(rows[0]?.indexdef).toMatch(/hnsw .*vector_cosine_ops/);

    await makeIssue({ title: "A", centroid: unit(0) });
    await makeIssue({ title: "B", centroid: unit(1) });
    await makeIssue({ title: "C", centroid: unit(2) });

    const query = `[${unit(1).join(",")}]`;
    const nearest = await testDb.db
      .select({ title: issues.title })
      .from(issues)
      .orderBy(sql`${issues.centroid} <=> ${query}::vector`)
      .limit(1);
    expect(nearest[0]?.title).toBe("B");
  });
});

describe("issue_feedback", () => {
  it("attaches feedback to an issue with similarity and method", async () => {
    const issue = await makeIssue();
    const item = await makeFeedback();
    const [link] = await testDb.db
      .insert(issueFeedback)
      .values({ issueId: issue.id, feedbackId: item.id, similarity: 0.91 })
      .returning();
    expect(link).toMatchObject({ method: "similarity", similarity: expect.closeTo(0.91, 5) });
  });

  it("lets a feedback item belong to only one issue", async () => {
    const a = await makeIssue({ title: "A" });
    const b = await makeIssue({ title: "B" });
    const item = await makeFeedback();
    await testDb.db.insert(issueFeedback).values({ issueId: a.id, feedbackId: item.id });

    expect(
      await pgErrorMessage(
        testDb.db.insert(issueFeedback).values({ issueId: b.id, feedbackId: item.id }),
      ),
    ).toMatch(/duplicate key/);
  });

  it("removes links when the issue is deleted but keeps the feedback", async () => {
    const issue = await makeIssue();
    const item = await makeFeedback();
    await testDb.db.insert(issueFeedback).values({ issueId: issue.id, feedbackId: item.id });

    await testDb.db.delete(issues).where(eq(issues.id, issue.id));

    expect(await testDb.db.select().from(issueFeedback)).toHaveLength(0);
    expect(await testDb.db.select().from(feedbackItems)).toHaveLength(1);
  });

  it("removes the link when the feedback is deleted but keeps the issue", async () => {
    const issue = await makeIssue();
    const item = await makeFeedback();
    await testDb.db.insert(issueFeedback).values({ issueId: issue.id, feedbackId: item.id });

    await testDb.db.delete(feedbackItems).where(eq(feedbackItems.id, item.id));

    expect(await testDb.db.select().from(issueFeedback)).toHaveLength(0);
    expect(await testDb.db.select().from(issues)).toHaveLength(1);
  });
});

describe("issue_events", () => {
  it("records an activity log in order with actor and data", async () => {
    const issue = await makeIssue();
    await testDb.db.insert(issueEvents).values([
      { issueId: issue.id, type: "created", actor: "ai" },
      {
        issueId: issue.id,
        type: "status_changed",
        actor: "owner",
        data: { from: "triage", to: "planned" },
      },
    ]);

    const events = await testDb.db
      .select()
      .from(issueEvents)
      .where(eq(issueEvents.issueId, issue.id))
      .orderBy(issueEvents.createdAt, issueEvents.type);
    expect(events.map((e) => e.type).sort()).toEqual(["created", "status_changed"]);
    expect(events.find((e) => e.type === "status_changed")?.data).toEqual({
      from: "triage",
      to: "planned",
    });
  });

  it("defaults the actor to system and rejects unknown event types", async () => {
    const issue = await makeIssue();
    const [event] = await testDb.db
      .insert(issueEvents)
      .values({ issueId: issue.id, type: "scored" })
      .returning();
    expect(event?.actor).toBe("system");

    expect(
      await pgErrorMessage(
        testDb.pool.query("INSERT INTO issue_events (issue_id, type) VALUES ($1, 'exploded')", [
          issue.id,
        ]),
      ),
    ).toMatch(/invalid input value for enum issue_event_type/);
  });
});

describe("notes", () => {
  it("stores a note authored by the owner by default", async () => {
    const issue = await makeIssue();
    const [note] = await testDb.db
      .insert(notes)
      .values({ issueId: issue.id, body: "Repro on the 1.2 build" })
      .returning();
    expect(note).toMatchObject({ author: "owner", body: "Repro on the 1.2 build" });
  });

  it("deletes events and notes together with their issue", async () => {
    const issue = await makeIssue();
    await testDb.db.insert(issueEvents).values({ issueId: issue.id, type: "created" });
    await testDb.db.insert(notes).values({ issueId: issue.id, body: "x" });

    await testDb.db.delete(issues).where(eq(issues.id, issue.id));

    expect(await testDb.db.select().from(issueEvents)).toHaveLength(0);
    expect(await testDb.db.select().from(notes)).toHaveLength(0);
  });
});
