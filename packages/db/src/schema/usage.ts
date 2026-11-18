import { boolean, index, integer, numeric, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { createdAt } from "./columns";

export const LLM_OPERATIONS = [
  "classify",
  "embed",
  "compare",
  "draft_reply",
  "detect_selector",
  "test_connection",
] as const;
export type LlmOperation = (typeof LLM_OPERATIONS)[number];
export const llmOperation = pgEnum("llm_operation", LLM_OPERATIONS);

/** One row per call to the LLM provider. Feeds the usage page and the budget cap. */
export const llmUsage = pgTable(
  "llm_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    operation: llmOperation("operation").notNull(),
    model: text("model").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    /** Estimated from the pricing table at call time. */
    costUsd: numeric("cost_usd", { precision: 12, scale: 6, mode: "number" }).notNull().default(0),
    success: boolean("success").notNull().default(true),
    error: text("error"),
    createdAt: createdAt(),
  },
  (table) => [
    index("llm_usage_created_idx").on(table.createdAt),
    index("llm_usage_model_idx").on(table.model),
  ],
);

export type LlmUsage = typeof llmUsage.$inferSelect;
export type NewLlmUsage = typeof llmUsage.$inferInsert;
