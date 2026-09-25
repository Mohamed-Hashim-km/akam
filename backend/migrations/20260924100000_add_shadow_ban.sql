ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isShadowBanned" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS "user_isShadowBanned_idx" ON "user" ("isShadowBanned");
