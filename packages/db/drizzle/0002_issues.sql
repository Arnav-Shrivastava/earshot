CREATE TYPE "public"."issue_event_type" AS ENUM('created', 'status_changed', 'assigned', 'unassigned', 'priority_changed', 'edited', 'feedback_added', 'feedback_moved', 'merged', 'scored', 'clustering_decision', 'pushed_to_github', 'shipped');--> statement-breakpoint
CREATE TYPE "public"."issue_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."issue_status" AS ENUM('triage', 'planned', 'in_progress', 'shipped');--> statement-breakpoint
CREATE TYPE "public"."membership_method" AS ENUM('similarity', 'llm', 'manual');--> statement-breakpoint
CREATE TABLE "issue_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"type" "issue_event_type" NOT NULL,
	"actor" text DEFAULT 'system' NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_feedback" (
	"feedback_id" uuid PRIMARY KEY NOT NULL,
	"issue_id" uuid NOT NULL,
	"similarity" real,
	"method" "membership_method" DEFAULT 'similarity' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"status" "issue_status" DEFAULT 'triage' NOT NULL,
	"priority" "issue_priority" DEFAULT 'medium' NOT NULL,
	"assignee" text,
	"mention_count" integer DEFAULT 0 NOT NULL,
	"first_seen_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"score" real DEFAULT 0 NOT NULL,
	"score_breakdown" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score_reason" text,
	"scored_at" timestamp with time zone,
	"centroid" vector(512),
	"linked_ticket_url" text,
	"shipped_at" timestamp with time zone,
	"release_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"body" text NOT NULL,
	"author" text DEFAULT 'owner' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "issue_events" ADD CONSTRAINT "issue_events_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_feedback" ADD CONSTRAINT "issue_feedback_feedback_id_feedback_items_id_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_feedback" ADD CONSTRAINT "issue_feedback_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_issue_id_issues_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_events_issue_created_idx" ON "issue_events" USING btree ("issue_id","created_at");--> statement-breakpoint
CREATE INDEX "issue_feedback_issue_idx" ON "issue_feedback" USING btree ("issue_id");--> statement-breakpoint
CREATE INDEX "issues_status_idx" ON "issues" USING btree ("status");--> statement-breakpoint
CREATE INDEX "issues_assignee_idx" ON "issues" USING btree ("assignee");--> statement-breakpoint
CREATE INDEX "issues_score_idx" ON "issues" USING btree ("score" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "issues_centroid_hnsw_idx" ON "issues" USING hnsw ("centroid" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "notes_issue_idx" ON "notes" USING btree ("issue_id");