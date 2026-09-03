import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/akam_db',
});

async function checkQuery() {
  const client = await pool.connect();
  const res = await client.query(`
    SELECT id, email, name, role, "isFeatured", "sortOrder", "createdAt"
    FROM "user"
    WHERE role = 'AUTHOR'::"Role"
    ORDER BY CASE WHEN "sortOrder" > 0 THEN 0 ELSE 1 END ASC, "sortOrder" ASC, "createdAt" DESC
    LIMIT 4
  `);
  console.log('Query Results (Top 4):', res.rows);
  client.release();
  await pool.end();
}

checkQuery();
