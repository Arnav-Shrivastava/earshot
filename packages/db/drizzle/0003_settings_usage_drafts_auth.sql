CREATE TYPE "public"."api_key_scope" AS ENUM('ingest', 'widget');--> statement-breakpoint
CREATE TYPE "public"."draft_status" AS ENUM('draft', 'sent', 'discarded');--> statement-breakpoint
CREATE TYPE "public"."llm_operation" AS ENUM('classify', 'embed', 'compare', 'draft_reply', 'detect_selector', 'test_connection');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"scope" "api_key_scope" NOT NULL,
	"prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"allowed_origins" text[] DEFAULT '{}' NOT NULL,
	"last_used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_key_hash_unique" UNIQUE("key_hash")
);
--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reply_drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"feedback_id" uuid NOT NULL,
	"language" text NOT NULL,
	"body" text NOT NULL,
	"body_en" text,
	"source_link" text,
	"model" text,
	"status" "draft_status" DEFAULT 'draft' NOT NULL,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reply_drafts_issue_feedback_unique" UNIQUE("issue_id","feedback_id")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"openai_api_key_encrypted" text,
	"classify_model" text,
	"embed_model" text,
	"draft_model" text,
	"model_pricing" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"monthly_budget_usd" numeric(10, 2),
	"cluster_join_threshold" real DEFAULT 0.85 NOT NULL,
	"cluster_new_threshold" real DEFAULT 0.7 NOT NULL,
	"scoring_weights" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"owner_name" text,
	"setup_completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_singleton" CHECK ("settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "llm_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation" "llm_operation" NOT NULL,
	"model" text NOT NULL,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" numeric(12, 6) DEFAULT 0 NOT NULL,
	"success" boolean DEFAULT true NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_drafts" ADD CONSTRAINT "reply_drafts_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_drafts" ADD CONSTRAINT "reply_drafts_feedback_id_feedback_items_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_scope_idx" ON "api_keys" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "account_user_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_user_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "reply_drafts_status_idx" ON "reply_drafts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "llm_usage_created_idx" ON "llm_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "llm_usage_model_idx" ON "llm_usage" USING btree ("model");