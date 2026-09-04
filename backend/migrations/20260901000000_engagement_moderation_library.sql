-- Migration: Add engagement, moderation, and library tables

-- 1. Create story_bookmark table
CREATE TABLE IF NOT EXISTS "story_bookmark" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "story_bookmark_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "story_bookmark_user_story_key" UNIQUE ("userId", "storyId")
);
CREATE INDEX IF NOT EXISTS "story_bookmark_userId_idx" ON "story_bookmark"("userId");
CREATE INDEX IF NOT EXISTS "story_bookmark_storyId_idx" ON "story_bookmark"("storyId");

ALTER TABLE "story_bookmark" DROP CONSTRAINT IF EXISTS "story_bookmark_userId_fkey";
ALTER TABLE "story_bookmark" ADD CONSTRAINT "story_bookmark_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "story_bookmark" DROP CONSTRAINT IF EXISTS "story_bookmark_storyId_fkey";
ALTER TABLE "story_bookmark" ADD CONSTRAINT "story_bookmark_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Create story_like table
CREATE TABLE IF NOT EXISTS "story_like" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "story_like_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "story_like_user_story_key" UNIQUE ("userId", "storyId")
);
CREATE INDEX IF NOT EXISTS "story_like_userId_idx" ON "story_like"("userId");
CREATE INDEX IF NOT EXISTS "story_like_storyId_idx" ON "story_like"("storyId");

ALTER TABLE "story_like" DROP CONSTRAINT IF EXISTS "story_like_userId_fkey";
ALTER TABLE "story_like" ADD CONSTRAINT "story_like_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "story_like" DROP CONSTRAINT IF EXISTS "story_like_storyId_fkey";
ALTER TABLE "story_like" ADD CONSTRAINT "story_like_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. Create story_comment table
CREATE TABLE IF NOT EXISTS "story_comment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "story_comment_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "story_comment_userId_idx" ON "story_comment"("userId");
CREATE INDEX IF NOT EXISTS "story_comment_storyId_idx" ON "story_comment"("storyId");

ALTER TABLE "story_comment" DROP CONSTRAINT IF EXISTS "story_comment_userId_fkey";
ALTER TABLE "story_comment" ADD CONSTRAINT "story_comment_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "story_comment" DROP CONSTRAINT IF EXISTS "story_comment_storyId_fkey";
ALTER TABLE "story_comment" ADD CONSTRAINT "story_comment_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Create story_report table
CREATE TABLE IF NOT EXISTS "story_report" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "storyId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "story_report_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "story_report_storyId_idx" ON "story_report"("storyId");
CREATE INDEX IF NOT EXISTS "story_report_reporterId_idx" ON "story_report"("reporterId");
CREATE INDEX IF NOT EXISTS "story_report_status_idx" ON "story_report"("status");

ALTER TABLE "story_report" DROP CONSTRAINT IF EXISTS "story_report_storyId_fkey";
ALTER TABLE "story_report" ADD CONSTRAINT "story_report_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "story_report" DROP CONSTRAINT IF EXISTS "story_report_reporterId_fkey";
ALTER TABLE "story_report" ADD CONSTRAINT "story_report_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 5. Create reading_progress table
CREATE TABLE IF NOT EXISTS "reading_progress" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "storyId" TEXT NOT NULL,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "lastScrollPosition" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "reading_progress_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "reading_progress_user_story_key" UNIQUE ("userId", "storyId")
);
CREATE INDEX IF NOT EXISTS "reading_progress_userId_idx" ON "reading_progress"("userId");
CREATE INDEX IF NOT EXISTS "reading_progress_storyId_idx" ON "reading_progress"("storyId");

ALTER TABLE "reading_progress" DROP CONSTRAINT IF EXISTS "reading_progress_userId_fkey";
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reading_progress" DROP CONSTRAINT IF EXISTS "reading_progress_storyId_fkey";
ALTER TABLE "reading_progress" ADD CONSTRAINT "reading_progress_storyId_fkey"
  FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
