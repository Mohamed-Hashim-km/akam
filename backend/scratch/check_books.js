import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const res = await pool.query('SELECT id, title, author, "preorderLink" FROM "book_release"');
  console.log('Current book releases in DB count:', res.rows.length);
  console.log(JSON.stringify(res.rows, null, 2));
  await pool.end();
}

main().catch(console.error);
