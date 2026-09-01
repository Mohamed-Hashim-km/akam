import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

async function safeQuery(sql: string, label: string) {
  try {
    await pool.query(sql);
    console.log(`✅ ${label}`);
  } catch (e: any) {
    console.log(`⚠️ ${label} (Notice: ${e.message})`);
  }
}

async function main() {
  console.log('--- Initializing database schema on Supabase ---');

  // 1. Create base user table if not exists
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS "user" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "email" TEXT NOT NULL,
        "name" TEXT,
        "bio" TEXT,
        "avatarUrl" TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "user_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX IF NOT EXISTS "user_email_key" ON "user"("email");
  `, 'Base user table');

  // 2. Create Enums
  await safeQuery(`
    DO $$ BEGIN
      CREATE TYPE "Role" AS ENUM ('READER', 'AUTHOR', 'EDITOR', 'ADMIN');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;

    DO $$ BEGIN
      CREATE TYPE "NotificationType" AS ENUM ('STORY_SUBMITTED', 'STORY_APPROVED', 'STORY_REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
  `, 'Enums creation');

  // 3. Add role enum column
  await safeQuery(`
    ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" "Role" NOT NULL DEFAULT 'READER';
  `, 'User role column');

  // 4. Create otp_code table
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS otp_code (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "email" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "otp_code_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX IF NOT EXISTS "otp_code_email_idx" ON otp_code("email");
  `, 'otp_code table');

  // 5. Create OtpCode table
  await safeQuery(`
    CREATE TABLE IF NOT EXISTS "OtpCode" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "email" TEXT NOT NULL,
        "code" TEXT NOT NULL,
        "expiresAt" TIMESTAMPTZ NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `, 'OtpCode table');

  // 6. Create Story table
  await safeQuery(`
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
  `, 'Story table');

  // 7. Create Notification table
  await safeQuery(`
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
  `, 'Notification table');

  console.log('\n--- Seeding Editor & Admin Users on Supabase ---');

  // Upsert Editor account
  const editorRes = await pool.query(
    `INSERT INTO "user" (id, email, name, role, "createdAt", "updatedAt") 
     VALUES (gen_random_uuid()::text, 'editor@akamdigital.com', 'Senior Editor', 'EDITOR'::"Role", NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET role = 'EDITOR'::"Role", name = COALESCE("user".name, 'Senior Editor'), "updatedAt" = NOW()
     RETURNING id, email, name, role;`
  );
  console.log('✅ Editor Account:', editorRes.rows[0]);

  // Upsert Admin account
  const adminRes = await pool.query(
    `INSERT INTO "user" (id, email, name, role, "createdAt", "updatedAt") 
     VALUES (gen_random_uuid()::text, 'admin@akamdigital.com', 'Platform Admin', 'ADMIN'::"Role", NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET role = 'ADMIN'::"Role", name = COALESCE("user".name, 'Platform Admin'), "updatedAt" = NOW()
     RETURNING id, email, name, role;`
  );
  console.log('✅ Admin Account:', adminRes.rows[0]);

  // List all users
  const allUsers = await pool.query(`SELECT id, email, name, role FROM "user" ORDER BY email ASC;`);
  console.log('\n--- Database Users on Supabase ---');
  console.table(allUsers.rows);

  await pool.end();
}

main().catch((e) => {
  console.error('❌ Error during database migration/seed:', e);
  process.exit(1);
});
