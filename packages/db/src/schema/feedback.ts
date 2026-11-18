import { EMBEDDING_DIMENSIONS } from "@earshot/core";
import {
  boolean,
  integer,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  unique,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

import { createdAt, tstz, updatedAt } from "./columns";
import { sources } from "./sources";

export const FEEDBACK_TYPES = [
  "bug",
  "feature_request",
  "complaint",
  "praise",
  "question",
  "other",
] as const;
export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export const feedbackType = pgEnum("feedback_type", FEEDBACK_TYPES);

export const SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type Severity = (typeof SEVERITIES)[number];
export const severity = pgEnum("severity", SEVERITIES);

export const SENTIMENTS = ["negative", "neutral", "positive"] as const;
export type Sentiment = (typeof SENTIMENTS)[number];
export const sentiment = pgEnum("sentiment", SENTIMENTS);

/** Where an item is in the AI pipeline. `failed` items are retried, not dropped. */
export const PIPELINE_STATUSES = [
  "pending",
  "classified",
  "embedded",
  "clustered",
  "failed",
] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];
export const pipelineStatus = pgEnum("pipeline_status", PIPELINE_STATUSES);

/** One piece of user feedback, normalized from any source. */
export const feedbackItems = pgTable(
  "feedback_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sourceId: uuid("source_id")
      .notNull()
      .references(() => sources.id, { onDelete: "cascade" }),
    /** Id in the upstream system (Steam review id, email Message-ID, ...). Null for CSV/widget. */
    externalId: text("external_id"),
    /** Hash of the normalized text, used to skip duplicates. */
    contentHash: text("content_hash").notNull(),

    /** Original text exactly as received (after HTML stripping and length cap). Untrusted. */
    rawText: text("raw_text").notNull(),
    author: text("author"),
    authorIsPaying: boolean("author_is_paying").notNull().default(false),
    /** When the user wrote it, if the source says. */
    occurredAt: tstz("occurred_at"),
    receivedAt: tstz("received_at").notNull().defaultNow(),
    /** Source-specific extras (playtime, app version, email subject, ...). */
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),

    // --- AI classification (filled by the pipeline) ---
    type: feedbackType("type"),
    severity: severity("severity"),
    sentiment: sentiment("sentiment"),
    /** BCP 47 tag such as "en" or "pt-BR". */
    language: text("language"),
    summaryEn: text("summary_en"),
    classifiedAt: tstz("classified_at"),

    embedding: vector("embedding", { dimensions: EMBEDDING_DIMENSIONS }),
    embeddedAt: tstz("embedded_at"),

    pipelineStatus: pipelineStatus("pipeline_status").notNull().default("pending"),
    pipelineError: text("pipeline_error"),
    pipelineAttempts: integer("pipeline_attempts").notNull().default(0),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    // Multiple NULL external ids are allowed, so CSV and widget rows are unaffected.
    unique("feedback_source_external_unique").on(table.sourceId, table.externalId),
    index("feedback_content_hash_idx").on(table.contentHash),
    index("feedback_pipeline_status_idx").on(table.pipelineStatus),
    index("feedback_occurred_at_idx").on(table.occurredAt),
  ],
);

export type FeedbackItem = typeof feedbackItems.$inferSelect;
export type NewFeedbackItem = typeof feedbackItems.$inferInsert;
