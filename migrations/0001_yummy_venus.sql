ALTER TABLE "tests" ALTER COLUMN "uuid" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tests" ALTER COLUMN "uuid" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "questions" jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "duration" integer;--> statement-breakpoint
ALTER TABLE "tests" ADD COLUMN "is_anonymous" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "icon_url";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "icon_name";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "color";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "background_color";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "order";--> statement-breakpoint
ALTER TABLE "tests" DROP COLUMN "image_ids";--> statement-breakpoint
ALTER TABLE "tests" DROP COLUMN "thumbnail";--> statement-breakpoint
ALTER TABLE "tests" DROP COLUMN "settings";