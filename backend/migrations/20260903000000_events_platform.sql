-- Migration: 20260903000000_events_platform.sql
-- Description: Create event table and EventType enum for Editorial Managed Events & Workshops

CREATE TYPE "EventType" AS ENUM (
  'READING_SESSION',
  'DISCUSSION',
  'WORKSHOP',
  'PAST_ARCHIVE'
);

CREATE TABLE "event" (
  "id" TEXT NOT NULL,
  "type" "EventType" NOT NULL DEFAULT 'READING_SESSION',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "time" TEXT,
  "day" TEXT,
  "monthYear" TEXT,
  "eventDate" TIMESTAMP(3),
  "imageSrc" TEXT,
  "registerHref" TEXT,
  "isPublished" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "event_type_isPublished_idx" ON "event"("type", "isPublished");
