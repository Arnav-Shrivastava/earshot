CREATE TYPE "public"."feedback_type" AS ENUM('bug', 'feature_request', 'complaint', 'praise', 'question', 'other');--> statement-breakpoint
CREATE TYPE "public"."pipeline_status" AS ENUM('pending', 'classified', 'embedded', 'clustered', 'failed');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('negative', 'neutral', 'positive');--> statement-breakpoint
CREATE TYPE "public"."severity" AS ENUM('low', 'medium', 'high', 'critical');--> statement-breakpoint
CREATE TYPE "public"."source_status" AS ENUM('active', 'paused', 'error');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('csv', 'webhook', 'email', 'widget', 'github', 'steam', 'discord', 'scraper');--> statement-breakpoint
CREATE TABLE "feedback_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_id" uuid NOT NULL,
	"external_id" text,
	"content_hash" text NOT NULL,
	"raw_text" text NOT NULL,
	"author" text,
	"author_is_paying" boolean DEFAULT false NOT NULL,
	"occurred_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"type" "feedback_type",
	"severity" "severity",
	"sentiment" "sentiment",
	"language" text,
	"summary_en" text,
	"classified_at" timestamp with time zone,
	"embedding" vector(512),
	"embedded_at" timestamp with time zone,
	"pipeline_status" "pipeline_status" DEFAULT 'pending' NOT NULL,
	"pipeline_error" text,
	"pipeline_attempts" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_source_external_unique" UNIQUE("source_id","external_id")
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "source_type" NOT NULL,
	"name" text NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"secrets_encrypted" text,
	"status" "source_status" DEFAULT 'active' NOT NULL,
	"sync_cursor" jsonb,
	"last_synced_at" timestamp with time zone,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback_items" ADD CONSTRAINT "feedback_items_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_content_hash_idx" ON "feedback_items" USING btree ("content_hash");--> statement-breakpoint
CREATE INDEX "feedback_pipeline_status_idx" ON "feedback_items" USING btree ("pipeline_status");--> statement-breakpoint
CREATE INDEX "feedback_occurred_at_idx" ON "feedback_items" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "sources_type_idx" ON "sources" USING btree ("type");