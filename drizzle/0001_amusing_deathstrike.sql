CREATE TYPE "public"."hierarchy_version_status" AS ENUM('ok', 'needs_clarification');--> statement-breakpoint
CREATE TYPE "public"."translation_message_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TABLE "t3-docker-scaffold_hierarchy_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jobId" uuid NOT NULL,
	"campaignType" varchar(64) NOT NULL,
	"versionNumber" integer NOT NULL,
	"hierarchy" jsonb NOT NULL,
	"status" "hierarchy_version_status" NOT NULL,
	"validationErrors" jsonb,
	"changeSummary" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hierarchy_version_number_positive" CHECK ("t3-docker-scaffold_hierarchy_version"."versionNumber" > 0),
	CONSTRAINT "hierarchy_version_one_campaign" CHECK (jsonb_array_length("t3-docker-scaffold_hierarchy_version"."hierarchy" -> 'campaigns') = 1),
	CONSTRAINT "hierarchy_version_campaign_type_matches" CHECK ("t3-docker-scaffold_hierarchy_version"."hierarchy" -> 'campaigns' -> 0 ->> 'campaignType' = "t3-docker-scaffold_hierarchy_version"."campaignType"),
	CONSTRAINT "hierarchy_version_validation_errors_match_status" CHECK ((
        ("t3-docker-scaffold_hierarchy_version"."status" = 'ok' AND "t3-docker-scaffold_hierarchy_version"."validationErrors" IS NULL)
        OR
        (
          "t3-docker-scaffold_hierarchy_version"."status" = 'needs_clarification'
          AND jsonb_typeof("t3-docker-scaffold_hierarchy_version"."validationErrors") = 'array'
          AND jsonb_array_length("t3-docker-scaffold_hierarchy_version"."validationErrors") > 0
        )
      ))
);
--> statement-breakpoint
CREATE TABLE "t3-docker-scaffold_job_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jobId" uuid NOT NULL,
	"versionNumber" integer NOT NULL,
	"messageId" uuid,
	"pointerMap" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_version_number_positive" CHECK ("t3-docker-scaffold_job_version"."versionNumber" > 0)
);
--> statement-breakpoint
CREATE TABLE "t3-docker-scaffold_job" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ownerId" uuid NOT NULL,
	"platform" varchar(32) NOT NULL,
	"sourceFileRef" text NOT NULL,
	"modelId" varchar(256) NOT NULL,
	"plan" jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "t3-docker-scaffold_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jobId" uuid NOT NULL,
	"role" "translation_message_role" NOT NULL,
	"content" text NOT NULL,
	"resultingVersionIds" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "t3-docker-scaffold_user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "t3-docker-scaffold_hierarchy_version" ADD CONSTRAINT "t3-docker-scaffold_hierarchy_version_jobId_t3-docker-scaffold_job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."t3-docker-scaffold_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "t3-docker-scaffold_job_version" ADD CONSTRAINT "t3-docker-scaffold_job_version_jobId_t3-docker-scaffold_job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."t3-docker-scaffold_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "t3-docker-scaffold_job_version" ADD CONSTRAINT "t3-docker-scaffold_job_version_messageId_t3-docker-scaffold_message_id_fk" FOREIGN KEY ("messageId") REFERENCES "public"."t3-docker-scaffold_message"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "t3-docker-scaffold_job" ADD CONSTRAINT "t3-docker-scaffold_job_ownerId_t3-docker-scaffold_user_id_fk" FOREIGN KEY ("ownerId") REFERENCES "public"."t3-docker-scaffold_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "t3-docker-scaffold_message" ADD CONSTRAINT "t3-docker-scaffold_message_jobId_t3-docker-scaffold_job_id_fk" FOREIGN KEY ("jobId") REFERENCES "public"."t3-docker-scaffold_job"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "hierarchy_version_job_campaign_number_idx" ON "t3-docker-scaffold_hierarchy_version" USING btree ("jobId","campaignType","versionNumber");--> statement-breakpoint
CREATE INDEX "hierarchy_version_job_campaign_idx" ON "t3-docker-scaffold_hierarchy_version" USING btree ("jobId","campaignType");--> statement-breakpoint
CREATE UNIQUE INDEX "job_version_job_number_idx" ON "t3-docker-scaffold_job_version" USING btree ("jobId","versionNumber");--> statement-breakpoint
CREATE INDEX "job_version_message_idx" ON "t3-docker-scaffold_job_version" USING btree ("messageId");--> statement-breakpoint
CREATE INDEX "job_owner_idx" ON "t3-docker-scaffold_job" USING btree ("ownerId");--> statement-breakpoint
CREATE INDEX "message_job_idx" ON "t3-docker-scaffold_message" USING btree ("jobId");