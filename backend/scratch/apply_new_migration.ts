import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

async function main() {
  console.log('--- Adding commentId support to story_report ---');
  try {
    await pool.query(`
      ALTER TABLE story_report ALTER COLUMN "storyId" DROP NOT NULL;
      ALTER TABLE story_report ADD COLUMN IF NOT EXISTS "commentId" TEXT REFERENCES story_comment(id) ON DELETE CASCADE;
    `);
    console.log('✅ Schema migration for comment reporting applied successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
