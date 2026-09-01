-- Migration: Add full storytelling platform schema
-- Drop old tables if they exist (Article was the old name)
DROP TABLE IF EXISTS "article" CASCADE;
DROP TABLE IF EXISTS "Article" CASCADE;

-- Create enums
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('READER', 'AUTHOR', 'EDITOR', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('STORY_SUBMITTED', 'STORY_APPROVED', 'STORY_REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Update User table: add new columns, change role to enum
ALTER TABLE "user" 
  ADD COLUMN IF NOT EXISTS "bio" TEXT,
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;

-- Drop old role column and recreate as enum (safe migration)
ALTER TABLE "user" DROP COLUMN IF EXISTS "role";
ALTER TABLE "user" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'READER';

-- Create OtpCode table
CREATE TABLE IF NOT EXISTS "OtpCode" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "OtpCode_email_idx" ON "OtpCode"("email");

-- Create Story table
CREATE TABLE IF NOT EXISTS "Story" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "rejectionNote" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "Story_slug_key" ON "Story"("slug");
CREATE INDEX IF NOT EXISTS "Story_status_idx" ON "Story"("status");
CREATE INDEX IF NOT EXISTS "Story_authorId_idx" ON "Story"("authorId");
ALTER TABLE "Story" DROP CONSTRAINT IF EXISTS "Story_authorId_fkey";
ALTER TABLE "Story" ADD CONSTRAINT "Story_authorId_fkey" 
  FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create Notification table
CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "relatedStoryId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON "Notification"("read");
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_userId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" DROP CONSTRAINT IF EXISTS "Notification_relatedStoryId_fkey";
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedStoryId_fkey"
  FOREIGN KEY ("relatedStoryId") REFERENCES "Story"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Update Story updatedAt trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_story_updated_at ON "Story";
CREATE TRIGGER update_story_updated_at
    BEFORE UPDATE ON "Story"
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
