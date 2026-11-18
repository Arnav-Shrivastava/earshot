import { EMBEDDING_DIMENSIONS } from "@earshot/core";
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

import { createdAt, tstz, updatedAt } from "./columns";
import { feedbackItems } from "./feedback";

/** Board columns, left to right. */
export const ISSUE_STATUSES = ["triage", "planned", "in_progress", "shipped"] as const;
export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export const issueStatus = pgEnum("issue_status", ISSUE_STATUSES);

export const ISSUE_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];
export const issuePriority = pgEnum("issue_priority", ISSUE_PRIORITIES);

/** Why a piece of feedback is attached to an issue. */
export const MEMBERSHIP_METHODS = ["similarity", "llm", "manual"] as const;
export type MembershipMethod = (typeof MEMBERSHIP_METHODS)[number];
export const membershipMethod = pgEnum("membership_method", MEMBERSHIP_METHODS);

export const ISSUE_EVENT_TYPES = [
  "created",
  "status_changed",
  "assigned",
  "unassigned",
  "priority_changed",
  "edited",
  "feedback_added",
  "feedback_moved",
  "merged",
  "scored",
  "clustering_decision",
  "pushed_to_github",
  "shipped",
] as const;
export type IssueEventType = (typeof ISSUE_EVENT_TYPES)[number];
export const issueEventType = pgEnum("issue_event_type", ISSUE_EVENT_TYPES);

/** A group of feedback that describes the same problem or request. */
export const issues = pgTable(
  "issues",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    summary: text("summary").notNull().default(""),
    status: issueStatus("status").notNull().default("triage"),
    priority: issuePriority("priority").notNull().default("medium"),
    /** Free text name. "Me" is resolved by the app, so a team of one still works. */
    assignee: text("assignee"),

    /** Denormalized for fast lists; kept in sync by the clustering step. */
    mentionCount: integer("mention_count").notNull().default(0),
    firstSeenAt: tstz("first_seen_at"),
    lastSeenAt: tstz("last_seen_at"),

    score: real("score").notNull().default(0),
    /** Per-factor contributions, so the UI can show "why it's ranked here". */
    scoreBreakdown: jsonb("score_breakdown").$type<Record<string, unknown>>().notNull().default({}),
    scoreReason: text("score_reason"),
    scoredAt: tstz("scored_at"),

    /** Running mean of member embeddings, used to find the nearest issue. */
    centroid: vector("centroid", { dimensions: EMBEDDING_DIMENSIONS }),

    /** Set when the issue was pushed to an external tracker. */
    linkedTicketUrl: text("linked_ticket_url"),
    shippedAt: tstz("shipped_at"),
    releaseNote: text("release_note"),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("issues_status_idx").on(table.status),
    index("issues_assignee_idx").on(table.assignee),
    index("issues_score_idx").on(table.score.desc()),
    index("issues_centroid_hnsw_idx").using("hnsw", table.centroid.op("vector_cosine_ops")),
  ],
);

/** Membership of feedback in an issue. A feedback item belongs to at most one issue. */
export const issueFeedback = pgTable(
  "issue_feedback",
  {
    feedbackId: uuid("feedback_id")
      .primaryKey()
      .references(() => feedbackItems.id, { onDelete: "cascade" }),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    /** Cosine similarity to the issue centroid when attached; null for manual moves. */
    similarity: real("similarity"),
    method: membershipMethod("method").notNull().default("similarity"),
    createdAt: createdAt(),
  },
  (table) => [index("issue_feedback_issue_idx").on(table.issueId)],
);

/** Append-only activity log for an issue. */
export const issueEvents = pgTable(
  "issue_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    type: issueEventType("type").notNull(),
    /** "owner", "system" or "ai". */
    actor: text("actor").notNull().default("system"),
    /** Event details, e.g. { from: "triage", to: "planned" }. */
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (table) => [index("issue_events_issue_created_idx").on(table.issueId, table.createdAt)],
);

/** Free-form notes the owner writes on an issue. */
export const notes = pgTable(
  "notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    author: text("author").notNull().default("owner"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("notes_issue_idx").on(table.issueId)],
);

export type Issue = typeof issues.$inferSelect;
export type NewIssue = typeof issues.$inferInsert;
export type IssueFeedback = typeof issueFeedback.$inferSelect;
export type IssueEvent = typeof issueEvents.$inferSelect;
export type NewIssueEvent = typeof issueEvents.$inferInsert;
export type Note = typeof notes.$inferSelect;
