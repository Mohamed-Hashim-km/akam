import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

async function main() {
  console.log('--- Applying Book Releases DB Migration & Seed ---');
  try {
    // 1. Create Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "book_release" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "author" TEXT NOT NULL,
        "editionTag" TEXT DEFAULT 'Print Edition',
        "description" TEXT NOT NULL,
        "coverImage" TEXT,
        "preorderLink" TEXT,
        "isPublished" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "book_release_pkey" PRIMARY KEY ("id")
      );
    `);

    // 2. Create Index
    await pool.query(`
      CREATE INDEX IF NOT EXISTS "book_release_isPublished_idx" ON "book_release"("isPublished");
    `);

    console.log('✅ book_release table created successfully!');

    // 3. Seed initial book releases if table is empty
    const checkRes = await pool.query(`SELECT COUNT(*)::int AS cnt FROM "book_release"`);
    if (checkRes.rows[0].cnt === 0) {
      console.log('--- Seeding default book releases ---');
      await pool.query(`
        INSERT INTO "book_release" ("id", "title", "author", "editionTag", "description", "coverImage", "preorderLink", "isPublished")
        VALUES
          (
            'book-1',
            'Voices from the Coast',
            'By Rahul Varma',
            'Print Edition',
            'The novel published on Akam is now available as a book.',
            '/images/books/book-1.jpg',
            'https://amazon.com',
            true
          ),
          (
            'book-2',
            'The Silent Canopy',
            'By Anjali Menon',
            'Hardcover',
            'The novel published on Akam is now available as a book.',
            '/images/books/book-2.jpg',
            'https://amazon.com',
            true
          ),
          (
            'book-3',
            'Before Darkness Falls',
            'By Priyanka Menon',
            'Print Edition',
            'The novel published on Akam is now available as a book.',
            '/images/books/book-3.jpg',
            'https://amazon.com',
            true
          );
      `);
      console.log('✅ Default book releases seeded successfully!');
    }
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
