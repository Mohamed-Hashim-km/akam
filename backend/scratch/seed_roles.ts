import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

async function main() {
  console.log('--- Checking & Seeding Editor & Admin Users ---');

  // 1. Upsert Editor account
  const editorRes = await pool.query(
    `INSERT INTO "user" (id, email, name, role, "createdAt", "updatedAt") 
     VALUES (gen_random_uuid()::text, 'editor@akamdigital.com', 'Senior Editor', 'EDITOR'::"Role", NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET role = 'EDITOR'::"Role", name = COALESCE("user".name, 'Senior Editor'), "updatedAt" = NOW()
     RETURNING id, email, name, role;`
  );
  console.log('✅ Editor Account:', editorRes.rows[0]);

  // 2. Upsert Admin account
  const adminRes = await pool.query(
    `INSERT INTO "user" (id, email, name, role, "createdAt", "updatedAt") 
     VALUES (gen_random_uuid()::text, 'admin@akamdigital.com', 'Platform Admin', 'ADMIN'::"Role", NOW(), NOW())
     ON CONFLICT (email) DO UPDATE SET role = 'ADMIN'::"Role", name = COALESCE("user".name, 'Platform Admin'), "updatedAt" = NOW()
     RETURNING id, email, name, role;`
  );
  console.log('✅ Admin Account:', adminRes.rows[0]);

  // 3. List all users with non-reader roles
  const allUsers = await pool.query(`SELECT id, email, name, role FROM "user" ORDER BY email ASC;`);
  console.log('\n--- All Database Users ---');
  console.table(allUsers.rows);

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
