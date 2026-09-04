import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/akam_db',
});

async function migrateMediaTable() {
  console.log('🚀 Migrating media_video table...');
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "media_video" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "category" TEXT NOT NULL,
        "youtubeUrl" TEXT NOT NULL,
        "youtubeId" TEXT NOT NULL,
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "isFeatured" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "media_video_pkey" PRIMARY KEY ("id")
      );
    `);

    await client.query(`
      ALTER TABLE "media_video" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "media_video_category_isPublished_idx" ON "media_video"("category", "isPublished");
      CREATE INDEX IF NOT EXISTS "media_video_isFeatured_isPublished_idx" ON "media_video"("isFeatured", "isPublished");
    `);

    // Ensure at least 3 videos are marked as isFeatured
    await client.query(`
      UPDATE "media_video" SET "isFeatured" = true WHERE "id" IN ('media-1', 'media-2', 'media-3');
    `);

    console.log('✅ media_video table, isFeatured column & indexes verified/updated.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateMediaTable();
