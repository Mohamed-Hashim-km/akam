import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/akam_db',
});

async function migrateUserPhonePrivacy() {
  console.log('🚀 Migrating "user" table for phone and privacyPolicyAccepted columns...');
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" TEXT;
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "privacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT false;
    `);

    console.log('✅ Migration successful: "user" table phone and privacyPolicyAccepted columns are ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateUserPhonePrivacy();
