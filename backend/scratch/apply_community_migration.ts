import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('--- Applying 20260902000000_community_platform.sql to Supabase ---');
  const sqlPath = path.join(process.cwd(), 'migrations', '20260902000000_community_platform.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  try {
    await pool.query(sql);
    console.log('✅ Migration applied successfully!');
  } catch (err: any) {
    console.error('Migration error:', err.message);
  }

  // Also seed a sample author user membership and post if needed
  try {
    const userRes = await pool.query(`SELECT id FROM "user" LIMIT 1`);
    const userId = userRes.rows[0]?.id;
    const commRes = await pool.query(`SELECT id, slug FROM "community" LIMIT 1`);
    const comm = commRes.rows[0];

    if (userId && comm) {
      console.log(`Seeding sample membership and post for ${comm.slug}...`);
      await pool.query(
        `INSERT INTO community_membership (id, "userId", "communityId", role)
         VALUES (gen_random_uuid()::text, $1, $2, 'MEMBER')
         ON CONFLICT ("userId", "communityId") DO NOTHING`,
        [userId, comm.id]
      );

      await pool.query(
        `INSERT INTO community_post (id, "communityId", "authorId", title, body, flair, upvotes, "commentCount", "createdAt", "updatedAt")
         VALUES (
           gen_random_uuid()::text, $1, $2,
           'Welcome to the Antigravity Community!',
           'This is the inaugural post sharing our antigravity literary ideas. Feel free to join the discussion and post your thoughts!',
           'DISCUSSION', 12, 1, now(), now()
         ) ON CONFLICT DO NOTHING`,
        [comm.id, userId]
      );
      console.log('✅ Sample seed data created!');
    }
  } catch (err: any) {
    console.error('Seed error:', err.message);
  }

  await pool.end();
}

main();
