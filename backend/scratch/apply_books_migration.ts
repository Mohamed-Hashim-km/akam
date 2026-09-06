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
            'book-swargasthanaya-gandhiji',
            'Swargasthanaya Gandhiji',
            'Dr. K.T. Jaleel',
            'Print Edition',
            'ഗ്രന്ഥകാരനും പ്രഭാഷകനും രാഷ്ട്രീയ നിരീക്ഷകനുമായ ഡോ.കെ ടി ജലീലിന്റെ ദാർശനികമാനങ്ങളുള്ള പ്രബന്ധങ്ങളുടെ സമാഹാരം. മഹാത്മാഗാന്ധിയുടെ ജീവിതത്തെയും ദർശനത്തെയും മുൻനിർത്തിയുള്ള അസാധാരണ വിചാരങ്ങൾ ഈ കൃതിയെ ശ്രദ്ധേയമാക്കുന്നു.',
            NULL,
            'https://kairalibooks.com/product/swargasthanaya-gandhiji/',
            true
          ),
          (
            'book-peythozhinja-varshangal',
            'Peythozhinja Varshangal',
            'Mahalakshmi Manoj',
            'Print Edition',
            'ലാളിത്യത്തിന്റെ ഭംഗിയാണ് മഹാലക്ഷ്മി മനോജിന്റെ കഥകളെ ശ്രദ്ധേയമാക്കുന്നത്. പ്രവാസിയായി ജീവിക്കുമ്പോഴും നാട്ടോർമ്മകളിലൂടെ സഞ്ചരിക്കാൻ കൊതിക്കുന്നു ഈ എഴുത്തുകാരി. ഗൃഹാതുരത്വത്തിന്റെ അടയാളങ്ങൾ ഈ കഥകളിൽ നിറഞ്ഞു നിൽക്കുന്നു.',
            NULL,
            'https://kairalibooks.com/product/peythozhinja-varshangal/',
            true
          ),
          (
            'book-cheruvallikkattile-chengayimar',
            'Cheruvallikkattile Chengayimar',
            'P. I. Mini',
            'Print Edition',
            'സുന്ദരമായ ചെറുവള്ളിക്കാട്ടിന്റെ പശ്ചാത്തലത്തിൽ കുട്ടികൾക്ക് വേണ്ടി രചിക്കപ്പെട്ട മനോഹരമായ നോവൽ. കുട്ടികളിൽ ഒരാളായി കഥ പറഞ്ഞു പോകുന്ന കഥന രീതിയിലൂടെ വളരെ ലളിതമായ ഭാഷയിൽ കാടിനെയും കാട്ടിലെ നമ്മുടെ സഹജീവികളുടെയും കഥ ആവിഷ്കരിച്ചിരിക്കുന്നു.',
            NULL,
            'https://kairalibooks.com/product/cheruvallikkattile-chengayimar/',
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
