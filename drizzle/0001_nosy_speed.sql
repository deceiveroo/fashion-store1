CREATE TABLE "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"details" json,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"variant_id" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coupons" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"type" text NOT NULL,
	"value" numeric(10, 2) NOT NULL,
	"min_amount" numeric(10, 2) DEFAULT '0',
	"usage_limit" integer,
	"per_user_limit" integer,
	"used_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "coupons_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "product_variants" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"size" text,
	"color" text,
	"sku" text NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"price_adjustment" numeric(10, 2) DEFAULT '0',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "product_variants_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "support_chat_messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"user_email" text,
	"user_name" text,
	"message" text NOT NULL,
	"image_url" text,
	"sender" text NOT NULL,
	"ai_model" text,
	"is_resolved" boolean DEFAULT false,
	"user_agent" text,
	"ip_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_chat_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text,
	"user_email" text,
	"user_name" text,
	"status" text DEFAULT 'active' NOT NULL,
	"message_count" integer DEFAULT 0,
	"first_message" text,
	"last_message_at" timestamp,
	"resolved_at" timestamp,
	"resolved_by" text,
	"notes" text,
	"taken_over_by" text,
	"taken_over_at" timestamp,
	"ai_disabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "support_chat_sessions_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
ALTER TABLE "attribute_values" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "attributes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "carts" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "link_events" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "media" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "order_promotions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_attribute_values" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_category_links" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_recommendations" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product_tag_links" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "promotions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "reviews" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "site_config" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tags" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_product_interactions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "wishlists" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "attribute_values" CASCADE;--> statement-breakpoint
DROP TABLE "attributes" CASCADE;--> statement-breakpoint
DROP TABLE "carts" CASCADE;--> statement-breakpoint
DROP TABLE "link_events" CASCADE;--> statement-breakpoint
DROP TABLE "media" CASCADE;--> statement-breakpoint
DROP TABLE "order_promotions" CASCADE;--> statement-breakpoint
DROP TABLE "product_attribute_values" CASCADE;--> statement-breakpoint
DROP TABLE "product_category_links" CASCADE;--> statement-breakpoint
DROP TABLE "product_recommendations" CASCADE;--> statement-breakpoint
DROP TABLE "product_tag_links" CASCADE;--> statement-breakpoint
DROP TABLE "promotions" CASCADE;--> statement-breakpoint
DROP TABLE "reviews" CASCADE;--> statement-breakpoint
DROP TABLE "site_config" CASCADE;--> statement-breakpoint
DROP TABLE "tags" CASCADE;--> statement-breakpoint
DROP TABLE "user_product_interactions" CASCADE;--> statement-breakpoint
DROP TABLE "wishlists" CASCADE;--> statement-breakpoint
ALTER TABLE "verification_tokens" DROP CONSTRAINT "verification_tokens_token_unique";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_fkey";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_order_id_fkey";
--> statement-breakpoint
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_product_id_fkey";
--> statement-breakpoint
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "product_category" DROP CONSTRAINT "product_category_product_id_fkey";
--> statement-breakpoint
ALTER TABLE "product_category" DROP CONSTRAINT "product_category_category_id_fkey";
--> statement-breakpoint
ALTER TABLE "product_images" DROP CONSTRAINT "product_images_product_id_fkey";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_profiles" DROP CONSTRAINT "user_profiles_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP CONSTRAINT "user_wishlist_items_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP CONSTRAINT "user_wishlist_items_wishlist_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP CONSTRAINT "user_wishlist_items_product_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP CONSTRAINT "user_wishlist_items_created_by_fkey";
--> statement-breakpoint
DROP INDEX "accounts_provider_account_id_unique";--> statement-breakpoint
DROP INDEX "categories_parent_idx";--> statement-breakpoint
DROP INDEX "order_items_order_product_idx";--> statement-breakpoint
DROP INDEX "product_category_product_id_idx";--> statement-breakpoint
DROP INDEX "product_category_category_id_idx";--> statement-breakpoint
DROP INDEX "product_images_product_idx";--> statement-breakpoint
DROP INDEX "product_images_order_idx";--> statement-breakpoint
DROP INDEX "products_featured_idx";--> statement-breakpoint
DROP INDEX "user_wishlist_item_unique_idx";--> statement-breakpoint
DROP INDEX "user_wishlist_item_user_idx";--> statement-breakpoint
DROP INDEX "user_wishlist_item_wishlist_idx";--> statement-breakpoint
DROP INDEX "user_wishlist_item_product_idx";--> statement-breakpoint
DROP INDEX "user_wishlist_item_valid_from_idx";--> statement-breakpoint
DROP INDEX "user_wishlist_item_valid_to_idx";--> statement-breakpoint
DROP INDEX "users_role_idx";--> statement-breakpoint
DROP INDEX "verification_tokens_token_unique";--> statement-breakpoint
DROP INDEX "categories_slug_idx";--> statement-breakpoint
DROP INDEX "users_email_idx";--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "locale" SET DEFAULT 'ru';--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "quantity" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "price" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "total" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_category" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "product_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "product_images" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "price" SET DATA TYPE numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'sessions'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "sessions" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_wishlist_items" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'customer';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "variant_id" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "size" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "discount" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_price" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "delivery_method" text DEFAULT 'courier';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_method" text DEFAULT 'card';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_status" text DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_intent_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "transaction_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "crypto_currency" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "crypto_address" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "crypto_tx_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "crypto_amount" numeric(20, 8);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "recipient" json;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "comment" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "short_description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "sku" text NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "compare_at_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "weight" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "category_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seo_title" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "seo_desc" text;--> statement-breakpoint
ALTER TABLE "sessions" ADD COLUMN "id" text PRIMARY KEY NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" text DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_messages" ADD CONSTRAINT "support_chat_messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_sessions" ADD CONSTRAINT "support_chat_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_sessions" ADD CONSTRAINT "support_chat_sessions_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_chat_sessions" ADD CONSTRAINT "support_chat_sessions_taken_over_by_users_id_fk" FOREIGN KEY ("taken_over_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_user_idx" ON "activity_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_logs_action_idx" ON "activity_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cart_items_user_product_variant_unique" ON "cart_items" USING btree ("user_id","product_id","variant_id");--> statement-breakpoint
CREATE INDEX "cart_items_user_idx" ON "cart_items" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "coupons_code_idx" ON "coupons" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variants_sku_idx" ON "product_variants" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "product_variants_product_idx" ON "product_variants" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "settings_key_idx" ON "settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "support_chat_messages_session_idx" ON "support_chat_messages" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "support_chat_messages_user_idx" ON "support_chat_messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_chat_messages_created_at_idx" ON "support_chat_messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "support_chat_messages_sender_idx" ON "support_chat_messages" USING btree ("sender");--> statement-breakpoint
CREATE UNIQUE INDEX "support_chat_sessions_session_id_idx" ON "support_chat_sessions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "support_chat_sessions_user_idx" ON "support_chat_sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "support_chat_sessions_status_idx" ON "support_chat_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "support_chat_sessions_created_at_idx" ON "support_chat_sessions" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_product_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wishlist_items" ADD CONSTRAINT "user_wishlist_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wishlist_items" ADD CONSTRAINT "user_wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "categories_name_idx" ON "categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "orders_payment_status_idx" ON "orders" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_category_product_category_unique" ON "product_category" USING btree ("product_id","category_id");--> statement-breakpoint
CREATE INDEX "product_category_product_idx" ON "product_category" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_category_category_idx" ON "product_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_images_product_order_idx" ON "product_images" USING btree ("product_id","order");--> statement-breakpoint
CREATE UNIQUE INDEX "products_slug_idx" ON "products" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "products_sku_idx" ON "products" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_profiles_user_id_idx" ON "user_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_wishlist_items_user_product_unique" ON "user_wishlist_items" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "user_wishlist_items_user_idx" ON "user_wishlist_items" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_tokens_identifier_token_unique" ON "verification_tokens" USING btree ("identifier","token");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "locale";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "meta";--> statement-breakpoint
ALTER TABLE "order_items" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "locale";--> statement-breakpoint
ALTER TABLE "orders" DROP COLUMN "meta";--> statement-breakpoint
ALTER TABLE "product_images" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "is_featured";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "locale";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "meta";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "wishlist_id";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "valid_from";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "valid_to";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "position";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "locale";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "created_by";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "reason";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "meta";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "deleted_at";--> statement-breakpoint
ALTER TABLE "user_wishlist_items" DROP COLUMN "updated_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "two_factor_secret";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "last_edited_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "affinity_scores";--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_sku_unique" UNIQUE("sku");--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token");