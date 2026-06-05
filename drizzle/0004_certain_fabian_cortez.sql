CREATE TABLE "api_response_time_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path" text NOT NULL,
	"method" text NOT NULL,
	"status_code" integer NOT NULL,
	"duration_ms" double precision NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_response_time_logs_duration_ms_check" CHECK ("api_response_time_logs"."duration_ms" >= 0)
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_key" text;--> statement-breakpoint
CREATE INDEX "api_response_time_logs_created_at_idx" ON "api_response_time_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "api_response_time_logs_duration_ms_idx" ON "api_response_time_logs" USING btree ("duration_ms");--> statement-breakpoint
CREATE INDEX "api_response_time_logs_path_idx" ON "api_response_time_logs" USING btree ("path");--> statement-breakpoint
CREATE INDEX "products_image_key_idx" ON "products" USING btree ("image_key");