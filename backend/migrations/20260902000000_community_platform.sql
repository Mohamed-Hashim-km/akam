-- ═══════════════════════════════════════════════════════════════════
-- Migration: Community Platform — Reddit-style communities & posts
-- ═══════════════════════════════════════════════════════════════════

-- ENUMS
DO $$ BEGIN
  CREATE TYPE "PostStatus" AS ENUM ('ACTIVE', 'LOCKED', 'REMOVED', 'PINNED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "VoteValue" AS ENUM ('UP', 'DOWN');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CommunityMemberRole" AS ENUM ('MEMBER', 'MODERATOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PostFlair" AS ENUM ('DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'RESOURCE', 'FEEDBACK');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1. community
CREATE TABLE IF NOT EXISTS "community" (
  "id"          TEXT         NOT NULL DEFAULT gen_random_uuid()::text,
  "slug"        TEXT         NOT NULL,
  "name"        TEXT         NOT NULL,
  "description" TEXT,
  "bannerUrl"   TEXT,
  "iconUrl"     TEXT,
  "color"       TEXT,
  "isActive"    BOOLEAN      NOT NULL DEFAULT true,
  "memberCount" INTEGER      NOT NULL DEFAULT 0,
  "postCount"   INTEGER      NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ  NOT NULL DEFAULT now(),
  CONSTRAINT "community_pkey"     PRIMARY KEY ("id"),
  CONSTRAINT "community_slug_key" UNIQUE ("slug")
);
CREATE INDEX IF NOT EXISTS "community_slug_idx"     ON "community" ("slug");
CREATE INDEX IF NOT EXISTS "community_isActive_idx" ON "community" ("isActive");

INSERT INTO "community" ("slug", "name", "description", "color")
VALUES
  ('childrens-literature',     'Children''s Literature',       'Engaging stories and rhymes to inspire young readers.',                '#29ABE1'),
  ('fiction-serialized-novels','Fiction & Serialized Novels',  'Captivating multi-part stories and rich immersive long-form fiction.', '#21B573'),
  ('malayalam-literature',     'Malayalam Literature',          'Classic works, essays, and deep cultural literary studies.',           '#DF882B'),
  ('novella',                  'Novella',                      'Deep short-novel stories offering rich, concise narrative arcs.',      '#D9DF20'),
  ('poetry-masika',            'Poetry & Masika',              'Expressive verse, contemporary poems, and digital magazine editions.', '#29ABE1'),
  ('tech-digital-culture',     'Tech & Digital Culture',       'Insightful essays exploring technology, society, and cyber culture.', '#21B573'),
  ('translations',             'Translations',                 'Translated literary works connecting Malayalam with world literature.','#DF882B')
ON CONFLICT ("slug") DO NOTHING;

-- 2. community_membership
CREATE TABLE IF NOT EXISTS "community_membership" (
  "id"          TEXT                   NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"      TEXT                   NOT NULL,
  "communityId" TEXT                   NOT NULL,
  "role"        "CommunityMemberRole"  NOT NULL DEFAULT 'MEMBER',
  "joinedAt"    TIMESTAMPTZ            NOT NULL DEFAULT now(),
  CONSTRAINT "community_membership_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "community_membership_unique" UNIQUE ("userId", "communityId")
);

ALTER TABLE "community_membership" DROP CONSTRAINT IF EXISTS "community_membership_userId_fkey";
ALTER TABLE "community_membership" ADD CONSTRAINT "community_membership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "community_membership" DROP CONSTRAINT IF EXISTS "community_membership_commId_fkey";
ALTER TABLE "community_membership" ADD CONSTRAINT "community_membership_commId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "cm_communityId_idx" ON "community_membership" ("communityId");
CREATE INDEX IF NOT EXISTS "cm_userId_idx"      ON "community_membership" ("userId");

-- 3. community_post
CREATE TABLE IF NOT EXISTS "community_post" (
  "id"           TEXT           NOT NULL DEFAULT gen_random_uuid()::text,
  "communityId"  TEXT           NOT NULL,
  "authorId"     TEXT           NOT NULL,
  "title"        TEXT           NOT NULL,
  "body"         TEXT,
  "imageUrl"     TEXT,
  "linkUrl"      TEXT,
  "flair"        "PostFlair"    NOT NULL DEFAULT 'DISCUSSION',
  "status"       "PostStatus"   NOT NULL DEFAULT 'ACTIVE',
  "upvotes"      INTEGER        NOT NULL DEFAULT 0,
  "downvotes"    INTEGER        NOT NULL DEFAULT 0,
  "commentCount" INTEGER        NOT NULL DEFAULT 0,
  "isPinned"     BOOLEAN        NOT NULL DEFAULT false,
  "isLocked"     BOOLEAN        NOT NULL DEFAULT false,
  "lockedAt"     TIMESTAMPTZ,
  "lockedById"   TEXT,
  "createdAt"    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ    NOT NULL DEFAULT now(),
  CONSTRAINT "cp_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "community_post" DROP CONSTRAINT IF EXISTS "cp_commId_fkey";
ALTER TABLE "community_post" ADD CONSTRAINT "cp_commId_fkey"
  FOREIGN KEY ("communityId") REFERENCES "community"("id") ON DELETE CASCADE;
ALTER TABLE "community_post" DROP CONSTRAINT IF EXISTS "cp_authId_fkey";
ALTER TABLE "community_post" ADD CONSTRAINT "cp_authId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "community_post" DROP CONSTRAINT IF EXISTS "cp_lockId_fkey";
ALTER TABLE "community_post" ADD CONSTRAINT "cp_lockId_fkey"
  FOREIGN KEY ("lockedById") REFERENCES "user"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "cp_communityId_status_idx" ON "community_post" ("communityId", "status");
CREATE INDEX IF NOT EXISTS "cp_authorId_idx"           ON "community_post" ("authorId");
CREATE INDEX IF NOT EXISTS "cp_createdAt_idx"          ON "community_post" ("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "cp_upvotes_idx"            ON "community_post" ("upvotes" DESC);

-- 4. community_comment (self-referential)
CREATE TABLE IF NOT EXISTS "community_comment" (
  "id"          TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "postId"      TEXT        NOT NULL,
  "authorId"    TEXT        NOT NULL,
  "parentId"    TEXT,
  "body"        TEXT        NOT NULL,
  "depth"       INTEGER     NOT NULL DEFAULT 0,
  "upvotes"     INTEGER     NOT NULL DEFAULT 0,
  "downvotes"   INTEGER     NOT NULL DEFAULT 0,
  "isRemoved"   BOOLEAN     NOT NULL DEFAULT false,
  "removedById" TEXT,
  "removedAt"   TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "cc_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "community_comment" DROP CONSTRAINT IF EXISTS "cc_postId_fkey";
ALTER TABLE "community_comment" ADD CONSTRAINT "cc_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "community_post"("id") ON DELETE CASCADE;
ALTER TABLE "community_comment" DROP CONSTRAINT IF EXISTS "cc_authId_fkey";
ALTER TABLE "community_comment" ADD CONSTRAINT "cc_authId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "community_comment" DROP CONSTRAINT IF EXISTS "cc_parId_fkey";
ALTER TABLE "community_comment" ADD CONSTRAINT "cc_parId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "community_comment"("id") ON DELETE CASCADE;
ALTER TABLE "community_comment" DROP CONSTRAINT IF EXISTS "cc_remId_fkey";
ALTER TABLE "community_comment" ADD CONSTRAINT "cc_remId_fkey"
  FOREIGN KEY ("removedById") REFERENCES "user"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "cc_postId_parentId_idx" ON "community_comment" ("postId", "parentId");
CREATE INDEX IF NOT EXISTS "cc_authorId_idx"        ON "community_comment" ("authorId");

-- 5. post_vote
CREATE TABLE IF NOT EXISTS "post_vote" (
  "id"        TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT          NOT NULL,
  "postId"    TEXT          NOT NULL,
  "value"     "VoteValue"   NOT NULL,
  "createdAt" TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT "pv_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "pv_unique" UNIQUE ("userId", "postId")
);

ALTER TABLE "post_vote" DROP CONSTRAINT IF EXISTS "pv_userId_fkey";
ALTER TABLE "post_vote" ADD CONSTRAINT "pv_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "post_vote" DROP CONSTRAINT IF EXISTS "pv_postId_fkey";
ALTER TABLE "post_vote" ADD CONSTRAINT "pv_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "community_post"("id") ON DELETE CASCADE;

-- 6. comment_vote
CREATE TABLE IF NOT EXISTS "comment_vote" (
  "id"        TEXT          NOT NULL DEFAULT gen_random_uuid()::text,
  "userId"    TEXT          NOT NULL,
  "commentId" TEXT          NOT NULL,
  "value"     "VoteValue"   NOT NULL,
  "createdAt" TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT "cv_pkey"   PRIMARY KEY ("id"),
  CONSTRAINT "cv_unique" UNIQUE ("userId", "commentId")
);

ALTER TABLE "comment_vote" DROP CONSTRAINT IF EXISTS "cv_userId_fkey";
ALTER TABLE "comment_vote" ADD CONSTRAINT "cv_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "comment_vote" DROP CONSTRAINT IF EXISTS "cv_commentId_fkey";
ALTER TABLE "comment_vote" ADD CONSTRAINT "cv_commentId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "community_comment"("id") ON DELETE CASCADE;

-- 7. community_report
CREATE TABLE IF NOT EXISTS "community_report" (
  "id"           TEXT        NOT NULL DEFAULT gen_random_uuid()::text,
  "postId"       TEXT,
  "commentId"    TEXT,
  "reporterId"   TEXT        NOT NULL,
  "reason"       TEXT        NOT NULL,
  "details"      TEXT,
  "status"       TEXT        NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt"   TIMESTAMPTZ,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "cr_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "community_report" DROP CONSTRAINT IF EXISTS "cr_postId_fkey";
ALTER TABLE "community_report" ADD CONSTRAINT "cr_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "community_post"("id") ON DELETE CASCADE;
ALTER TABLE "community_report" DROP CONSTRAINT IF EXISTS "cr_commId_fkey";
ALTER TABLE "community_report" ADD CONSTRAINT "cr_commId_fkey"
  FOREIGN KEY ("commentId") REFERENCES "community_comment"("id") ON DELETE CASCADE;
ALTER TABLE "community_report" DROP CONSTRAINT IF EXISTS "cr_repId_fkey";
ALTER TABLE "community_report" ADD CONSTRAINT "cr_repId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "user"("id") ON DELETE CASCADE;
ALTER TABLE "community_report" DROP CONSTRAINT IF EXISTS "cr_revId_fkey";
ALTER TABLE "community_report" ADD CONSTRAINT "cr_revId_fkey"
  FOREIGN KEY ("reviewedById") REFERENCES "user"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "cr_status_idx" ON "community_report" ("status");
CREATE INDEX IF NOT EXISTS "cr_postId_idx" ON "community_report" ("postId");
