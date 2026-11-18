import { check, integer, jsonb, numeric, pgTable, real, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { createdAt, tstz, updatedAt } from "./columns";

/** USD per one million tokens for a model, used to estimate cost. */
export interface ModelPrice {
  inputPerMillion: number;
  outputPerMillion: number;
}

/**
 * Exactly one row (id = 1) holds all owner-editable configuration.
 * Model names have no default on purpose: the owner chooses them in the setup
 * wizard or settings page, and the app never hardcodes one.
 */
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),

    /** AES-256-GCM encrypted OpenAI API key. Never plaintext, never returned to the browser. */
    openaiApiKeyEncrypted: text("openai_api_key_encrypted"),
    classifyModel: text("classify_model"),
    embedModel: text("embed_model"),
    draftModel: text("draft_model"),
    /** Estimated prices keyed by model name. */
    modelPricing: jsonb("model_pricing").$type<Record<string, ModelPrice>>().notNull().default({}),

    /** Monthly spend cap in USD. Null means no cap. */
    monthlyBudgetUsd: numeric("monthly_budget_usd", { precision: 10, scale: 2, mode: "number" }),

    /** Cosine similarity at or above which feedback joins the nearest issue. */
    clusterJoinThreshold: real("cluster_join_threshold").notNull().default(0.85),
    /** Below this a new issue is created; between the two the LLM decides. */
    clusterNewThreshold: real("cluster_new_threshold").notNull().default(0.7),
    /** Relative weights for mentions, recency, severity, paying users, velocity. */
    scoringWeights: jsonb("scoring_weights").$type<Record<string, number>>().notNull().default({}),

    /** Name used for "Assign to me". */
    ownerName: text("owner_name"),
    setupCompletedAt: tstz("setup_completed_at"),

    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [check("settings_singleton", sql`${table.id} = 1`)],
);

export type Settings = typeof settings.$inferSelect;
