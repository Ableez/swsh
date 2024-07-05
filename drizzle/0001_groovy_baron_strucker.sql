ALTER TABLE "user" RENAME COLUMN "password_hash" TO "pushNotificationSubscription";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "pushNotificationSubscription" SET DATA TYPE json;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "passwordHash" varchar(255);--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN IF EXISTS "push_notification_subscription";