CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "attribute_values" (
	"id" text PRIMARY KEY NOT NULL,
	"attribute_id" text NOT NULL,
	"value" text NOT NULL,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "attributes_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" text,
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"parent_id" text,
	"materialized_path" text,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "link_events" (
	"id" text PRIMARY KEY NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"action" text NOT NULL,
	"old_values" jsonb,
	"new_values" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"entity_type" text NOT NULL,
	"entity_id" text NOT NULL,
	"role" text DEFAULT 'gallery',
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"price" integer NOT NULL,
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"promotion_id" text NOT NULL,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"created_by" text,
	"reason" text,
	"meta" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"total" integer NOT NULL,
	"status" text DEFAULT 'pending',
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_attribute_values" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"attribute_value_id" text NOT NULL,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"created_by" text,
	"reason" text,
	"meta" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_category" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_category_links" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"category_id" text NOT NULL,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"reason" text,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "product_images" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text,
	"url" text NOT NULL,
	"is_main" boolean DEFAULT false,
	"order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_recommendations" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"recommended_id" text NOT NULL,
	"score" integer DEFAULT 0,
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "product_tag_links" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"tag_id" text NOT NULL,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"created_by" text,
	"reason" text,
	"meta" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"price" integer NOT NULL,
	"in_stock" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"value" integer NOT NULL,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb,
	"description" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "site_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_product_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"interaction_type" text NOT NULL,
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"address" text,
	"avatar" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_wishlist_items" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"wishlist_id" text NOT NULL,
	"product_id" text NOT NULL,
	"valid_from" timestamp,
	"valid_to" timestamp,
	"position" integer DEFAULT 0,
	"locale" text DEFAULT 'en',
	"created_by" text,
	"reason" text,
	"meta" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"password" text,
	"email_verified" timestamp,
	"image" text,
	"role" text DEFAULT 'user',
	"two_factor_secret" text,
	"last_edited_at" timestamp,
	"affinity_scores" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'Default',
	"position" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"locale" text DEFAULT 'en',
	"meta" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attribute_values" ADD CONSTRAINT "attribute_values_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "public"."attributes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "public"."promotions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_promotions" ADD CONSTRAINT "order_promotions_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_attribute_value_id_fkey" FOREIGN KEY ("attribute_value_id") REFERENCES "public"."attribute_values"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_attribute_values" ADD CONSTRAINT "product_attribute_values_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category_links" ADD CONSTRAINT "product_category_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category_links" ADD CONSTRAINT "product_category_links_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_recommended_id_fkey" FOREIGN KEY ("recommended_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tag_links" ADD CONSTRAINT "product_tag_links_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tag_links" ADD CONSTRAINT "product_tag_links_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tag_links" ADD CONSTRAINT "product_tag_links_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_product_interactions" ADD CONSTRAINT "user_product_interactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_product_interactions" ADD CONSTRAINT "user_product_interactions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wishlist_items" ADD CONSTRAINT "user_wishlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wishlist_items" ADD CONSTRAINT "user_wishlist_items_wishlist_id_fkey" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wishlist_items" ADD CONSTRAINT "user_wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wishlist_items" ADD CONSTRAINT "user_wishlist_items_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "accounts_provider_account_id_unique" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "attribute_values_attribute_idx" ON "attribute_values" USING btree ("attribute_id");--> statement-breakpoint
CREATE INDEX "attribute_values_value_idx" ON "attribute_values" USING btree ("value");--> statement-breakpoint
CREATE INDEX "attributes_slug_idx" ON "attributes" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "carts_user_idx" ON "carts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "carts_session_idx" ON "carts" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "link_events_entity_type_idx" ON "link_events" USING btree ("entity_type");--> statement-breakpoint
CREATE INDEX "link_events_entity_id_idx" ON "link_events" USING btree ("entity_id");--> statement-breakpoint
CREATE INDEX "link_events_created_at_idx" ON "link_events" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "media_entity_idx" ON "media" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "media_role_idx" ON "media" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "order_items_order_product_idx" ON "order_items" USING btree ("order_id","product_id");--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_items_product_idx" ON "order_items" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "order_promotion_unique_idx" ON "order_promotions" USING btree ("order_id","promotion_id");--> statement-breakpoint
CREATE INDEX "order_promotion_order_idx" ON "order_promotions" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "order_promotion_promotion_idx" ON "order_promotions" USING btree ("promotion_id");--> statement-breakpoint
CREATE INDEX "order_promotion_valid_from_idx" ON "order_promotions" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "order_promotion_valid_to_idx" ON "order_promotions" USING btree ("valid_to");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "product_attribute_value_unique_idx" ON "product_attribute_values" USING btree ("product_id","attribute_value_id");--> statement-breakpoint
CREATE INDEX "product_attribute_value_product_idx" ON "product_attribute_values" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_attribute_value_attribute_value_idx" ON "product_attribute_values" USING btree ("attribute_value_id");--> statement-breakpoint
CREATE INDEX "product_attribute_value_valid_from_idx" ON "product_attribute_values" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "product_attribute_value_valid_to_idx" ON "product_attribute_values" USING btree ("valid_to");--> statement-breakpoint
CREATE INDEX "product_category_product_id_idx" ON "product_category" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_category_category_id_idx" ON "product_category" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_category_links_product_id_idx" ON "product_category_links" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_category_links_category_id_idx" ON "product_category_links" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "product_images_product_idx" ON "product_images" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_images_order_idx" ON "product_images" USING btree ("order");--> statement-breakpoint
CREATE UNIQUE INDEX "product_recommendation_unique_idx" ON "product_recommendations" USING btree ("product_id","recommended_id");--> statement-breakpoint
CREATE INDEX "product_recommendation_product_idx" ON "product_recommendations" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_recommendation_recommended_idx" ON "product_recommendations" USING btree ("recommended_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_tag_unique_idx" ON "product_tag_links" USING btree ("product_id","tag_id");--> statement-breakpoint
CREATE INDEX "product_tag_product_idx" ON "product_tag_links" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_tag_tag_idx" ON "product_tag_links" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "product_tag_valid_from_idx" ON "product_tag_links" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "product_tag_valid_to_idx" ON "product_tag_links" USING btree ("valid_to");--> statement-breakpoint
CREATE INDEX "products_name_idx" ON "products" USING btree ("name");--> statement-breakpoint
CREATE INDEX "products_price_idx" ON "products" USING btree ("price");--> statement-breakpoint
CREATE INDEX "products_featured_idx" ON "products" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "promotions_name_idx" ON "promotions" USING btree ("name");--> statement-breakpoint
CREATE INDEX "reviews_user_product_idx" ON "reviews" USING btree ("user_id","product_id");--> statement-breakpoint
CREATE INDEX "reviews_product_idx" ON "reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "reviews_rating_idx" ON "reviews" USING btree ("rating");--> statement-breakpoint
CREATE INDEX "site_config_key_idx" ON "site_config" USING btree ("key");--> statement-breakpoint
CREATE INDEX "tags_slug_idx" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "user_product_interaction_idx" ON "user_product_interactions" USING btree ("user_id","product_id","interaction_type");--> statement-breakpoint
CREATE INDEX "user_product_interaction_user_idx" ON "user_product_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_product_interaction_product_idx" ON "user_product_interactions" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "user_product_interaction_type_idx" ON "user_product_interactions" USING btree ("interaction_type");--> statement-breakpoint
CREATE UNIQUE INDEX "user_wishlist_item_unique_idx" ON "user_wishlist_items" USING btree ("user_id","wishlist_id","product_id");--> statement-breakpoint
CREATE INDEX "user_wishlist_item_user_idx" ON "user_wishlist_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_wishlist_item_wishlist_idx" ON "user_wishlist_items" USING btree ("wishlist_id");--> statement-breakpoint
CREATE INDEX "user_wishlist_item_product_idx" ON "user_wishlist_items" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "user_wishlist_item_valid_from_idx" ON "user_wishlist_items" USING btree ("valid_from");--> statement-breakpoint
CREATE INDEX "user_wishlist_item_valid_to_idx" ON "user_wishlist_items" USING btree ("valid_to");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_tokens_token_unique" ON "verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "wishlists_user_idx" ON "wishlists" USING btree ("user_id");