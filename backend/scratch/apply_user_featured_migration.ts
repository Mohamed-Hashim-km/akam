import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/akam_db',
});

async function migrateUserTable() {
  console.log('🚀 Migrating "user" table for isFeatured...');
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS "user_isFeatured_role_idx" ON "user"("isFeatured", "role");
    `);

    // Check count of featured users
    const res = await client.query(`SELECT COUNT(*) FROM "user" WHERE "isFeatured" = true`);
    const count = parseInt(res.rows[0].count, 10);
    console.log(`Current featured users count: ${count}`);

    if (count === 0) {
      // Mark first few users as featured so there's initial data
      await client.query(`
        UPDATE "user" SET "isFeatured" = true 
        WHERE id IN (
          SELECT id FROM "user" ORDER BY "createdAt" ASC LIMIT 4
        );
      `);
      console.log('✅ Marked first 4 users as featured for initial display.');
    }

    console.log('✅ Migration successful: "user" table isFeatured column ready.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateUserTable();
