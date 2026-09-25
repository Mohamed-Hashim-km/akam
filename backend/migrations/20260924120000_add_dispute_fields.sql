-- Add DISPUTED to StoryStatus enum
ALTER TYPE "StoryStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';

-- Add dispute columns to story_report
ALTER TABLE story_report ADD COLUMN IF NOT EXISTS "authorResponse" TEXT;
ALTER TABLE story_report ADD COLUMN IF NOT EXISTS "authorRespondedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE story_report ADD COLUMN IF NOT EXISTS "disputeExpiresAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE story_report ADD COLUMN IF NOT EXISTS "disputedAt" TIMESTAMP WITH TIME ZONE;
ALTER TABLE story_report ADD COLUMN IF NOT EXISTS "editorialNote" TEXT;
