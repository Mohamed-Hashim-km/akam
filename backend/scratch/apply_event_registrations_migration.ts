import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

async function main() {
  console.log('--- Creating event_registration Table ---');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "event_registration" (
      "id" TEXT NOT NULL,
      "eventId" TEXT NOT NULL,
      "userId" TEXT,
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL,
      "phone" TEXT,
      "notes" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "event_registration_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "event_registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS "event_registration_eventId_idx" ON "event_registration"("eventId");
  `);

  console.log('✅ event_registration table created successfully!');
  await pool.end();
}

main().catch(console.error);
