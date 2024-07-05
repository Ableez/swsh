ALTER TABLE "user" ALTER COLUMN "emailVerified" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP;