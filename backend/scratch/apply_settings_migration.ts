import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

async function main() {
  console.log('--- Creating site_setting table for Editor Note management ---');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_setting (
          key VARCHAR(100) PRIMARY KEY,
          value JSONB NOT NULL,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO site_setting (key, value, "updatedAt")
      VALUES (
        'editors_note',
        '{"title": "Editor''s Note", "note": "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.", "bgImageSrc": "/images/home/editorialNot.webp"}'::jsonb,
        now()
      )
      ON CONFLICT (key) DO NOTHING;
    `);
    console.log('✅ Site settings table created and default Editor Note inserted successfully!');
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
