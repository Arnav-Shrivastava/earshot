import { index, pgEnum, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";

import { createdAt, tstz, updatedAt } from "./columns";
import { feedbackItems } from "./feedback";
import { issues } from "./issues";

export const DRAFT_STATUSES = ["draft", "sent", "discarded"] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];
export const draftStatus = pgEnum("draft_status", DRAFT_STATUSES);

/**
 * A "you asked, we shipped" reply written for one piece of feedback.
 * Earshot never sends these: `sent` only records that the owner sent it elsewhere.
 */
export const replyDrafts = pgTable(
  "reply_drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issues.id, { onDelete: "cascade" }),
    feedbackId: uuid("feedback_id")
      .notNull()
      .references(() => feedbackItems.id, { onDelete: "cascade" }),
    /** BCP 47 tag of the original feedback; the draft is written in this language. */
    language: text("language").notNull(),
    body: text("body").notNull(),
    /** English version for the owner to review. */
    bodyEn: text("body_en"),
    /** Link to the original post or review, when the source has one. */
    sourceLink: text("source_link"),
    model: text("model"),
    status: draftStatus("status").notNull().default("draft"),
    sentAt: tstz("sent_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    // Makes draft generation idempotent: one draft per feedback item per issue.
    unique("reply_drafts_issue_feedback_unique").on(table.issueId, table.feedbackId),
    index("reply_drafts_status_idx").on(table.status),
  ],
);

export type ReplyDraft = typeof replyDrafts.$inferSelect;
export type NewReplyDraft = typeof replyDrafts.$inferInsert;
