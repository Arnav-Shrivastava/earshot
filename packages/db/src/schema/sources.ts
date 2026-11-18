import { index, jsonb, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { createdAt, tstz, updatedAt } from "./columns";

export const SOURCE_TYPES = [
  "csv",
  "webhook",
  "email",
  "widget",
  "github",
  "steam",
  "discord",
  "scraper",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];
export const sourceType = pgEnum("source_type", SOURCE_TYPES);

export const SOURCE_STATUSES = ["active", "paused", "error"] as const;
export type SourceStatus = (typeof SOURCE_STATUSES)[number];
export const sourceStatus = pgEnum("source_status", SOURCE_STATUSES);

/** A place feedback comes from: a mailbox, a Steam app, a CSV import, the widget, ... */
export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: sourceType("type").notNull(),
    name: text("name").notNull(),
    /** Non-secret connector settings (folder name, app id, repo, ...). */
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    /** Connector credentials, AES-256-GCM encrypted by the app. Never plaintext. */
    secretsEncrypted: text("secrets_encrypted"),
    status: sourceStatus("status").notNull().default("active"),
    /** Opaque position in the upstream feed (IMAP UID, Steam cursor, ETag, ...). */
    syncCursor: jsonb("sync_cursor").$type<unknown>(),
    lastSyncedAt: tstz("last_synced_at"),
    lastError: text("last_error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("sources_type_idx").on(table.type)],
);

export type Source = typeof sources.$inferSelect;
export type NewSource = typeof sources.$inferInsert;
