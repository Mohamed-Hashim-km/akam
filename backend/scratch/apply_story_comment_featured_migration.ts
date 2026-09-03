import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/akam_db',
});

async function migrateStoryComment() {
  console.log('🚀 Migrating "story_comment" table for isFeatured...');
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE "story_comment" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT true;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "story_comment_isFeatured_idx" ON "story_comment"("isFeatured");
    `);

    console.log('✅ Migration successful: "story_comment" table isFeatured column ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateStoryComment();
