import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/akam_db',
});

async function migrateUserSortOrder() {
  console.log('🚀 Migrating "user" table for sortOrder column...');
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "sortOrder" INT NOT NULL DEFAULT 0;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "user_sortOrder_idx" ON "user"("sortOrder");
    `);

    console.log('✅ Migration successful: "user" table sortOrder column is ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateUserSortOrder();
