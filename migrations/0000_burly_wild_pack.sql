CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon_url" text,
	"icon_name" text,
	"color" text DEFAULT '#4F46E5',
	"background_color" text,
	"order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"test_id" integer NOT NULL,
	"completion_time" integer,
	"attempts_count" integer NOT NULL,
	"score" integer NOT NULL,
	"completed" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "images" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"image_url" text NOT NULL,
	"storage_key" text,
	"category_id" integer NOT NULL,
	"answers" jsonb NOT NULL,
	"hints" jsonb,
	"difficulty" integer DEFAULT 1,
	"play_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"created_by" integer,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "test_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"test_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tests" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"creator_id" integer,
	"category_id" integer,
	"image_ids" jsonb NOT NULL,
	"play_count" integer DEFAULT 0,
	"like_count" integer DEFAULT 0,
	"is_public" boolean DEFAULT true,
	"approved" boolean DEFAULT false,
	"featured" boolean DEFAULT false,
	"difficulty" integer DEFAULT 2,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp,
	"thumbnail" text,
	"settings" jsonb,
	CONSTRAINT "tests_uuid_unique" UNIQUE("uuid")
);
--> statement-breakpoint
CREATE TABLE "user_activities" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"user_name" text,
	"activity_type" text NOT NULL,
	"details" text,
	"entity_id" integer,
	"entity_type" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"uuid" uuid DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text,
	"score" integer DEFAULT 0,
	"avatar" text,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_uuid_unique" UNIQUE("uuid"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tests" ADD CONSTRAINT "tests_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activities" ADD CONSTRAINT "user_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;