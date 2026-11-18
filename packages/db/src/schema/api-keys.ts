import { index, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { createdAt, tstz } from "./columns";

/** `ingest` can write feedback from servers; `widget` is public, write-only and origin-limited. */
export const API_KEY_SCOPES = ["ingest", "widget"] as const;
export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];
export const apiKeyScope = pgEnum("api_key_scope", API_KEY_SCOPES);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    scope: apiKeyScope("scope").notNull(),
    /** First characters of the key, safe to show so keys can be told apart. */
    prefix: text("prefix").notNull(),
    /** SHA-256 hex of the full key. The key itself is shown once and never stored. */
    keyHash: text("key_hash").notNull().unique(),
    /** Browser origins allowed to use a widget key. Empty for ingest keys. */
    allowedOrigins: text("allowed_origins").array().notNull().default([]),
    lastUsedAt: tstz("last_used_at"),
    revokedAt: tstz("revoked_at"),
    createdAt: createdAt(),
  },
  (table) => [index("api_keys_scope_idx").on(table.scope)],
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
