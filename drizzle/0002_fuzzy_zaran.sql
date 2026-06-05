CREATE TYPE "public"."import_row_status" AS ENUM('VALID', 'INVALID', 'IMPORTED', 'FAILED', 'SKIPPED');--> statement-breakpoint
CREATE TYPE "public"."import_status" AS ENUM('UPLOADED', 'VALIDATING', 'PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED', 'ROLLED_BACK');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('IMPORT_PRODUCTS', 'GENERATE_INVENTORY_REPORT', 'GENERATE_MOVEMENT_REPORT', 'GENERATE_TRANSFER_REPORT', 'WAREHOUSE_SYNC', 'LOW_STOCK_CHECK');--> statement-breakpoint
CREATE TYPE "public"."report_type" AS ENUM('INVENTORY_SUMMARY', 'STOCK_MOVEMENT', 'TRANSFER_REPORT', 'LOW_STOCK_REPORT');--> statement-breakpoint
CREATE TYPE "public"."sync_status" AS ENUM('PENDING', 'SYNCING', 'COMPLETED', 'FAILED');--> statement-breakpoint
CREATE TYPE "public"."transfer_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED');--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'TRANSFER_COMPLETED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'TRANSFER_FAILED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'IMPORT_COMPLETED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'IMPORT_FAILED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'REPORT_COMPLETED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'REPORT_FAILED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'JOB_FAILED';--> statement-breakpoint
ALTER TYPE "public"."notification_type" ADD VALUE 'SYNC_FAILED';--> statement-breakpoint
ALTER TYPE "public"."stock_movement_type" ADD VALUE 'TRANSFER_OUT';--> statement-breakpoint
ALTER TYPE "public"."stock_movement_type" ADD VALUE 'TRANSFER_IN';--> statement-breakpoint
ALTER TYPE "public"."stock_movement_type" ADD VALUE 'IMPORT';--> statement-breakpoint
ALTER TYPE "public"."stock_movement_type" ADD VALUE 'ADJUSTMENT';--> statement-breakpoint
CREATE TABLE "import_batch_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_batch_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"raw_data" jsonb NOT NULL,
	"normalized_data" jsonb,
	"status" "import_row_status" DEFAULT 'VALID' NOT NULL,
	"error_message" text,
	"created_product_id" uuid,
	"created_movement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"status" "import_status" DEFAULT 'UPLOADED' NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"success_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"created_by" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_job_id" text,
	"type" "job_type" NOT NULL,
	"status" "job_status" DEFAULT 'PENDING' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error_message" text,
	"created_by" uuid,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"failed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jobs_progress_check" CHECK ("jobs"."progress" >= 0 and "jobs"."progress" <= 100)
);
--> statement-breakpoint
CREATE TABLE "report_exports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"type" "report_type" NOT NULL,
	"file_name" text NOT NULL,
	"status" "job_status" DEFAULT 'PENDING' NOT NULL,
	"filter" jsonb NOT NULL,
	"generated_by" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_transfer_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stock_transfer_items_quantity_check" CHECK ("stock_transfer_items"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "stock_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_number" text NOT NULL,
	"source_warehouse_id" uuid NOT NULL,
	"destination_warehouse_id" uuid NOT NULL,
	"status" "transfer_status" DEFAULT 'PENDING' NOT NULL,
	"requested_by" uuid NOT NULL,
	"notes" text,
	"error_message" text,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid,
	"transfer_id" uuid,
	"source_warehouse_id" uuid,
	"destination_warehouse_id" uuid,
	"status" "sync_status" DEFAULT 'PENDING' NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "import_batch_rows" ADD CONSTRAINT "import_batch_rows_import_batch_id_import_batches_id_fk" FOREIGN KEY ("import_batch_id") REFERENCES "public"."import_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_batches" ADD CONSTRAINT "import_batches_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_exports" ADD CONSTRAINT "report_exports_generated_by_users_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_transfer_id_stock_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfer_items" ADD CONSTRAINT "stock_transfer_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_source_warehouse_id_warehouses_id_fk" FOREIGN KEY ("source_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_destination_warehouse_id_warehouses_id_fk" FOREIGN KEY ("destination_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_transfers" ADD CONSTRAINT "stock_transfers_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_sync_logs" ADD CONSTRAINT "warehouse_sync_logs_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_sync_logs" ADD CONSTRAINT "warehouse_sync_logs_transfer_id_stock_transfers_id_fk" FOREIGN KEY ("transfer_id") REFERENCES "public"."stock_transfers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_sync_logs" ADD CONSTRAINT "warehouse_sync_logs_source_warehouse_id_warehouses_id_fk" FOREIGN KEY ("source_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "warehouse_sync_logs" ADD CONSTRAINT "warehouse_sync_logs_destination_warehouse_id_warehouses_id_fk" FOREIGN KEY ("destination_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "import_batch_rows_import_batch_id_idx" ON "import_batch_rows" USING btree ("import_batch_id");--> statement-breakpoint
CREATE INDEX "import_batch_rows_status_idx" ON "import_batch_rows" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_batches_created_at_idx" ON "import_batches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "import_batches_created_by_idx" ON "import_batches" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "import_batches_status_idx" ON "import_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_created_at_idx" ON "jobs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "jobs_created_by_idx" ON "jobs" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "jobs_queue_job_id_idx" ON "jobs" USING btree ("queue_job_id");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "jobs_type_idx" ON "jobs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "report_exports_created_at_idx" ON "report_exports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "report_exports_generated_by_idx" ON "report_exports" USING btree ("generated_by");--> statement-breakpoint
CREATE INDEX "report_exports_job_id_idx" ON "report_exports" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "report_exports_status_idx" ON "report_exports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "report_exports_type_idx" ON "report_exports" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stock_transfer_items_product_id_idx" ON "stock_transfer_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "stock_transfer_items_transfer_id_idx" ON "stock_transfer_items" USING btree ("transfer_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_created_at_idx" ON "stock_transfers" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_transfers_destination_warehouse_idx" ON "stock_transfers" USING btree ("destination_warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_requested_by_idx" ON "stock_transfers" USING btree ("requested_by");--> statement-breakpoint
CREATE INDEX "stock_transfers_source_warehouse_idx" ON "stock_transfers" USING btree ("source_warehouse_id");--> statement-breakpoint
CREATE INDEX "stock_transfers_status_idx" ON "stock_transfers" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "stock_transfers_transfer_number_idx" ON "stock_transfers" USING btree ("transfer_number");--> statement-breakpoint
CREATE INDEX "warehouse_sync_logs_created_at_idx" ON "warehouse_sync_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "warehouse_sync_logs_job_id_idx" ON "warehouse_sync_logs" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "warehouse_sync_logs_status_idx" ON "warehouse_sync_logs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "warehouse_sync_logs_transfer_id_idx" ON "warehouse_sync_logs" USING btree ("transfer_id");