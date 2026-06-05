CREATE TYPE "public"."audit_result" AS ENUM('SUCCESS', 'FAILED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."batch_status" AS ENUM('AVAILABLE', 'BLOCKED', 'DEPLETED', 'EXPIRED', 'RECALLED');--> statement-breakpoint
CREATE TYPE "public"."error_severity" AS ENUM('critical', 'warning', 'info');--> statement-breakpoint
CREATE TYPE "public"."import_row_status" AS ENUM('VALID', 'WARNING', 'FAILED', 'IMPORTED');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('QUEUED', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."job_type" AS ENUM('EMAIL_NOTIFICATION', 'IN_APP_NOTIFICATION', 'MEDICINE_IMPORT', 'REPORT_GENERATION', 'LOW_STOCK_SCAN', 'EXPIRY_SCAN', 'PAYMENT_FOLLOW_UP', 'RESERVATION_EXPIRY');--> statement-breakpoint
CREATE TYPE "public"."medicine_status" AS ENUM('ACTIVE', 'INACTIVE', 'DISCONTINUED', 'BLOCKED');--> statement-breakpoint
CREATE TYPE "public"."notification_severity" AS ENUM('critical', 'warning', 'info', 'success');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('LOW_STOCK', 'EXPIRING_MEDICINE', 'NEW_ORDER', 'PRESCRIPTION_REVIEW', 'PRESCRIPTION_APPROVED', 'PRESCRIPTION_REJECTED', 'PAYMENT_STATUS', 'ORDER_PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED', 'APPLICATION_ERROR', 'SYSTEM_ERROR', 'RESPONSE_TIME_ALERT', 'UPTIME_ALERT', 'IMPORT_COMPLETED', 'IMPORT_FAILED', 'REPORT_COMPLETED', 'REPORT_FAILED', 'JOB_FAILED');--> statement-breakpoint
CREATE TYPE "public"."order_channel" AS ENUM('ONLINE', 'COUNTER');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('DRAFT', 'AWAITING_PRESCRIPTION', 'PRESCRIPTION_REVIEW', 'PRESCRIPTION_REJECTED', 'AWAITING_PAYMENT', 'PAYMENT_PENDING', 'PAID', 'PROCESSING', 'READY_FOR_PICKUP', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('CASH', 'BANK_TRANSFER', 'QRIS', 'PAYMENT_GATEWAY');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'EXPIRED', 'CANCELLED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."prescription_status" AS ENUM('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_REVISION');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_type" AS ENUM('RECEIPT', 'SALE', 'RESERVATION', 'RESERVATION_RELEASE', 'CANCELLATION_RELEASE', 'ADJUSTMENT', 'RETURN', 'DISPOSAL', 'IMPORT_OPENING');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'PHARMACIST', 'CASHIER', 'CUSTOMER');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DISABLED');--> statement-breakpoint
CREATE TABLE "application_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"severity" "error_severity" NOT NULL,
	"source" text NOT NULL,
	"safe_message" text NOT NULL,
	"diagnostic_detail" text,
	"correlation_id" text,
	"user_id" uuid,
	"resolved_at" timestamp with time zone,
	"resolved_by_user_id" uuid,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"actor_role" "user_role",
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"result" "audit_result" NOT NULL,
	"description" text NOT NULL,
	"ip_address" "inet",
	"user_agent" text,
	"correlation_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_user_id" uuid NOT NULL,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"converted_order_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"address_line" text,
	"city" text,
	"province" text,
	"postal_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_row_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"import_run_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"status" "import_row_status" NOT NULL,
	"message" text,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text DEFAULT 'MEDICINE' NOT NULL,
	"status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"requester_user_id" uuid,
	"source_file_object_key" text NOT NULL,
	"original_file_name" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"valid_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"safe_error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"queue_name" text NOT NULL,
	"job_type" "job_type" NOT NULL,
	"job_key" text NOT NULL,
	"status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"entity_type" text,
	"entity_id" text,
	"progress" integer DEFAULT 0 NOT NULL,
	"attempt" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"safe_error" text,
	"correlation_id" text,
	"locked_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicine_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medicine_id" uuid NOT NULL,
	"supplier_id" uuid,
	"batch_number" text NOT NULL,
	"received_date" date NOT NULL,
	"expiry_date" date NOT NULL,
	"purchase_cost" numeric(14, 2) NOT NULL,
	"available_quantity" integer DEFAULT 0 NOT NULL,
	"reserved_quantity" integer DEFAULT 0 NOT NULL,
	"status" "batch_status" DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicine_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicine_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medicine_id" uuid NOT NULL,
	"object_key" text NOT NULL,
	"public_url" text,
	"alt_text" text,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medicines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid,
	"code" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"unit" text DEFAULT 'unit' NOT NULL,
	"status" "medicine_status" DEFAULT 'ACTIVE' NOT NULL,
	"prescription_required" boolean DEFAULT false NOT NULL,
	"selling_price" numeric(14, 2) NOT NULL,
	"low_stock_threshold" integer DEFAULT 10 NOT NULL,
	"critical_stock_threshold" integer DEFAULT 3 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"role_target" "user_role",
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"severity" "notification_severity" NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp with time zone,
	"dedupe_key" text,
	"delivery_status" text DEFAULT 'pending' NOT NULL,
	"email_status" text,
	"action_href" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"medicine_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"subtotal" numeric(14, 2) NOT NULL,
	"prescription_required" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"from_status" "order_status",
	"to_status" "order_status" NOT NULL,
	"actor_user_id" uuid,
	"note" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_user_id" uuid,
	"cashier_user_id" uuid,
	"channel" "order_channel" NOT NULL,
	"status" "order_status" DEFAULT 'DRAFT' NOT NULL,
	"subtotal" numeric(14, 2) NOT NULL,
	"discount_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"tax_total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"grand_total" numeric(14, 2) NOT NULL,
	"prescription_required" boolean DEFAULT false NOT NULL,
	"fulfillment_method" text DEFAULT 'PICKUP' NOT NULL,
	"idempotency_key" text,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"provider_event_id" text,
	"event_type" text NOT NULL,
	"status" "payment_status" NOT NULL,
	"safe_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"provider" text DEFAULT 'manual' NOT NULL,
	"provider_reference" text,
	"method" "payment_method" NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"idempotency_key" text,
	"callback_verified_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescription_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prescription_id" uuid NOT NULL,
	"pharmacist_user_id" uuid NOT NULL,
	"decision" "prescription_status" NOT NULL,
	"notes" text NOT NULL,
	"approved_items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prescriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"customer_user_id" uuid NOT NULL,
	"original_object_key" text NOT NULL,
	"original_file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"status" "prescription_status" DEFAULT 'PENDING' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "job_status" DEFAULT 'QUEUED' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"requester_user_id" uuid,
	"file_object_key" text,
	"filename" text,
	"file_size_bytes" integer,
	"safe_error" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_token_hash" text NOT NULL,
	"csrf_token_hash" text NOT NULL,
	"user_agent" text,
	"ip_address" "inet",
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"idle_expires_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"revoked_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"medicine_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"type" "stock_movement_type" NOT NULL,
	"quantity_delta" integer NOT NULL,
	"available_before" integer NOT NULL,
	"available_after" integer NOT NULL,
	"reserved_before" integer NOT NULL,
	"reserved_after" integer NOT NULL,
	"reference_type" text,
	"reference_id" text,
	"reason" text NOT NULL,
	"actor_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_item_id" uuid,
	"medicine_id" uuid NOT NULL,
	"batch_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"released_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"contact_name" text,
	"email" text,
	"phone" text,
	"address" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"normalized_email" text NOT NULL,
	"phone" text,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'CUSTOMER' NOT NULL,
	"status" "user_status" DEFAULT 'PENDING_VERIFICATION' NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"email_verified_at" timestamp with time zone,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_errors" ADD CONSTRAINT "application_errors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_errors" ADD CONSTRAINT "application_errors_resolved_by_user_id_users_id_fk" FOREIGN KEY ("resolved_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_row_results" ADD CONSTRAINT "import_row_results_import_run_id_import_runs_id_fk" FOREIGN KEY ("import_run_id") REFERENCES "public"."import_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_runs" ADD CONSTRAINT "import_runs_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicine_batches" ADD CONSTRAINT "medicine_batches_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicine_batches" ADD CONSTRAINT "medicine_batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicine_images" ADD CONSTRAINT "medicine_images_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medicines" ADD CONSTRAINT "medicines_category_id_medicine_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."medicine_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cashier_user_id_users_id_fk" FOREIGN KEY ("cashier_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_reviews" ADD CONSTRAINT "prescription_reviews_prescription_id_prescriptions_id_fk" FOREIGN KEY ("prescription_id") REFERENCES "public"."prescriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescription_reviews" ADD CONSTRAINT "prescription_reviews_pharmacist_user_id_users_id_fk" FOREIGN KEY ("pharmacist_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prescriptions" ADD CONSTRAINT "prescriptions_customer_user_id_users_id_fk" FOREIGN KEY ("customer_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_batch_id_medicine_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."medicine_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_medicine_id_medicines_id_fk" FOREIGN KEY ("medicine_id") REFERENCES "public"."medicines"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_reservations" ADD CONSTRAINT "stock_reservations_batch_id_medicine_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."medicine_batches"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_errors_created_at_idx" ON "application_errors" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "application_errors_correlation_id_idx" ON "application_errors" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "application_errors_severity_idx" ON "application_errors" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "application_errors_source_idx" ON "application_errors" USING btree ("source");--> statement-breakpoint
CREATE INDEX "audit_logs_action_idx" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_cart_medicine_idx" ON "cart_items" USING btree ("cart_id","medicine_id");--> statement-breakpoint
CREATE INDEX "cart_items_medicine_id_idx" ON "cart_items" USING btree ("medicine_id");--> statement-breakpoint
CREATE INDEX "carts_customer_status_idx" ON "carts" USING btree ("customer_user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_profiles_user_id_idx" ON "customer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_expires_at_idx" ON "email_verification_tokens" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_tokens_token_hash_idx" ON "email_verification_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "email_verification_tokens_user_id_idx" ON "email_verification_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "import_row_results_run_row_idx" ON "import_row_results" USING btree ("import_run_id","row_number");--> statement-breakpoint
CREATE INDEX "import_row_results_status_idx" ON "import_row_results" USING btree ("status");--> statement-breakpoint
CREATE INDEX "import_runs_created_at_idx" ON "import_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "import_runs_requester_user_id_idx" ON "import_runs" USING btree ("requester_user_id");--> statement-breakpoint
CREATE INDEX "import_runs_status_idx" ON "import_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_runs_created_at_idx" ON "job_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "job_runs_entity_idx" ON "job_runs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_runs_job_key_idx" ON "job_runs" USING btree ("job_key");--> statement-breakpoint
CREATE INDEX "job_runs_queue_status_idx" ON "job_runs" USING btree ("queue_name","status");--> statement-breakpoint
CREATE INDEX "job_runs_status_idx" ON "job_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "medicine_batches_expiry_date_idx" ON "medicine_batches" USING btree ("expiry_date");--> statement-breakpoint
CREATE UNIQUE INDEX "medicine_batches_medicine_batch_idx" ON "medicine_batches" USING btree ("medicine_id","batch_number");--> statement-breakpoint
CREATE INDEX "medicine_batches_medicine_id_idx" ON "medicine_batches" USING btree ("medicine_id");--> statement-breakpoint
CREATE INDEX "medicine_batches_status_idx" ON "medicine_batches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "medicine_batches_supplier_id_idx" ON "medicine_batches" USING btree ("supplier_id");--> statement-breakpoint
CREATE UNIQUE INDEX "medicine_categories_code_idx" ON "medicine_categories" USING btree ("code");--> statement-breakpoint
CREATE INDEX "medicine_categories_is_active_idx" ON "medicine_categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "medicine_categories_name_idx" ON "medicine_categories" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "medicine_categories_slug_idx" ON "medicine_categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "medicine_images_medicine_id_idx" ON "medicine_images" USING btree ("medicine_id");--> statement-breakpoint
CREATE UNIQUE INDEX "medicine_images_object_key_idx" ON "medicine_images" USING btree ("object_key");--> statement-breakpoint
CREATE INDEX "medicines_category_id_idx" ON "medicines" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "medicines_code_idx" ON "medicines" USING btree ("code");--> statement-breakpoint
CREATE INDEX "medicines_name_idx" ON "medicines" USING btree ("name");--> statement-breakpoint
CREATE INDEX "medicines_prescription_required_idx" ON "medicines" USING btree ("prescription_required");--> statement-breakpoint
CREATE UNIQUE INDEX "medicines_slug_idx" ON "medicines" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "medicines_status_idx" ON "medicines" USING btree ("status");--> statement-breakpoint
CREATE INDEX "notifications_created_at_idx" ON "notifications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_is_read_idx" ON "notifications" USING btree ("is_read");--> statement-breakpoint
CREATE INDEX "notifications_role_target_idx" ON "notifications" USING btree ("role_target");--> statement-breakpoint
CREATE INDEX "notifications_severity_idx" ON "notifications" USING btree ("severity");--> statement-breakpoint
CREATE INDEX "notifications_type_idx" ON "notifications" USING btree ("type");--> statement-breakpoint
CREATE INDEX "notifications_user_id_idx" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notifications_dedupe_key_idx" ON "notifications" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "order_items_medicine_id_idx" ON "order_items" USING btree ("medicine_id");--> statement-breakpoint
CREATE INDEX "order_items_order_id_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_status_history_actor_user_id_idx" ON "order_status_history" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_cashier_user_id_idx" ON "orders" USING btree ("cashier_user_id");--> statement-breakpoint
CREATE INDEX "orders_channel_idx" ON "orders" USING btree ("channel");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "orders_customer_user_id_idx" ON "orders" USING btree ("customer_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_idempotency_key_idx" ON "orders" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_order_number_idx" ON "orders" USING btree ("order_number");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "payment_events_payment_id_idx" ON "payment_events" USING btree ("payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_events_provider_event_id_idx" ON "payment_events" USING btree ("provider_event_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_idx" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_order_id_idx" ON "payments" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_provider_reference_idx" ON "payments" USING btree ("provider_reference");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "prescription_reviews_pharmacist_user_id_idx" ON "prescription_reviews" USING btree ("pharmacist_user_id");--> statement-breakpoint
CREATE INDEX "prescription_reviews_prescription_id_idx" ON "prescription_reviews" USING btree ("prescription_id");--> statement-breakpoint
CREATE INDEX "prescriptions_customer_user_id_idx" ON "prescriptions" USING btree ("customer_user_id");--> statement-breakpoint
CREATE INDEX "prescriptions_order_id_idx" ON "prescriptions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "prescriptions_status_idx" ON "prescriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "report_runs_created_at_idx" ON "report_runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "report_runs_requester_user_id_idx" ON "report_runs" USING btree ("requester_user_id");--> statement-breakpoint
CREATE INDEX "report_runs_status_idx" ON "report_runs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "report_runs_type_idx" ON "report_runs" USING btree ("type");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "sessions_idle_expires_at_idx" ON "sessions" USING btree ("idle_expires_at");--> statement-breakpoint
CREATE INDEX "sessions_revoked_at_idx" ON "sessions" USING btree ("revoked_at");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_session_token_hash_idx" ON "sessions" USING btree ("session_token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "stock_movements_actor_user_id_idx" ON "stock_movements" USING btree ("actor_user_id");--> statement-breakpoint
CREATE INDEX "stock_movements_batch_id_idx" ON "stock_movements" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "stock_movements_created_at_idx" ON "stock_movements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_medicine_id_idx" ON "stock_movements" USING btree ("medicine_id");--> statement-breakpoint
CREATE INDEX "stock_movements_reference_idx" ON "stock_movements" USING btree ("reference_type","reference_id");--> statement-breakpoint
CREATE INDEX "stock_movements_type_idx" ON "stock_movements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "stock_reservations_active_idx" ON "stock_reservations" USING btree ("order_id","released_at","fulfilled_at");--> statement-breakpoint
CREATE INDEX "stock_reservations_batch_id_idx" ON "stock_reservations" USING btree ("batch_id");--> statement-breakpoint
CREATE INDEX "stock_reservations_expires_at_idx" ON "stock_reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "stock_reservations_order_id_idx" ON "stock_reservations" USING btree ("order_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_code_idx" ON "suppliers" USING btree ("code");--> statement-breakpoint
CREATE INDEX "suppliers_is_active_idx" ON "suppliers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "suppliers_name_idx" ON "suppliers" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_is_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "users_normalized_email_idx" ON "users" USING btree ("normalized_email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");