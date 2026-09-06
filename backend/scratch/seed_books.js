import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

const books = [
  {
    id: 'book-swargasthanaya-gandhiji',
    title: 'Swargasthanaya Gandhiji',
    author: 'Dr. K.T. Jaleel',
    editionTag: 'Print Edition',
    description: 'ഗ്രന്ഥകാരനും പ്രഭാഷകനും രാഷ്ട്രീയ നിരീക്ഷകനുമായ ഡോ.കെ ടി ജലീലിന്റെ ദാർശനികമാനങ്ങളുള്ള പ്രബന്ധങ്ങളുടെ സമാഹാരം. മഹാത്മാഗാന്ധിയുടെ ജീവിതത്തെയും ദർശനത്തെയും മുൻനിർത്തിയുള്ള അസാധാരണ വിചാരങ്ങൾ ഈ കൃതിയെ ശ്രദ്ധേയമാക്കുന്നു.',
    coverImage: null,
    preorderLink: 'https://kairalibooks.com/product/swargasthanaya-gandhiji/',
    isPublished: true,
  },
  {
    id: 'book-peythozhinja-varshangal',
    title: 'Peythozhinja Varshangal',
    author: 'Mahalakshmi Manoj',
    editionTag: 'Print Edition',
    description: 'ലാളിത്യത്തിന്റെ ഭംഗിയാണ് മഹാലക്ഷ്മി മനോജിന്റെ കഥകളെ ശ്രദ്ധേയമാക്കുന്നത്. പ്രവാസിയായി ജീവിക്കുമ്പോഴും നാട്ടോർമ്മകളിലൂടെ സഞ്ചരിക്കാൻ കൊതിക്കുന്നു ഈ എഴുത്തുകാരി. ഗൃഹാതുരത്വത്തിന്റെ അടയാളങ്ങൾ ഈ കഥകളിൽ നിറഞ്ഞു നിൽക്കുന്നു.',
    coverImage: null,
    preorderLink: 'https://kairalibooks.com/product/peythozhinja-varshangal/',
    isPublished: true,
  },
  {
    id: 'book-cheruvallikkattile-chengayimar',
    title: 'Cheruvallikkattile Chengayimar',
    author: 'P. I. Mini',
    editionTag: 'Print Edition',
    description: 'സുന്ദരമായ ചെറുവള്ളിക്കാട്ടിന്റെ പശ്ചാത്തലത്തിൽ കുട്ടികൾക്ക് വേണ്ടി രചിക്കപ്പെട്ട മനോഹരമായ നോവൽ. കുട്ടികളിൽ ഒരാളായി കഥ പറഞ്ഞു പോകുന്ന കഥന രീതിയിലൂടെ വളരെ ലളിതമായ ഭാഷയിൽ കാടിനെയും കാട്ടിലെ നമ്മുടെ സഹജീവികളുടെയും കഥ ആവിഷ്കരിച്ചിരിക്കുന്നു.',
    coverImage: null,
    preorderLink: 'https://kairalibooks.com/product/cheruvallikkattile-chengayimar/',
    isPublished: true,
  },
];

async function main() {
  console.log('--- Seeding Books in Database ---');

  // 1. Remove current data
  const delRes = await pool.query('DELETE FROM "book_release"');
  console.log(`Deleted ${delRes.rowCount} previous book release records.`);

  // 2. Insert new books
  for (const b of books) {
    await pool.query(
      `INSERT INTO "book_release" ("id", "title", "author", "editionTag", "description", "coverImage", "preorderLink", "isPublished", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [b.id, b.title, b.author, b.editionTag, b.description, b.coverImage, b.preorderLink, b.isPublished]
    );
    console.log(`Inserted book: "${b.title}" (${b.preorderLink})`);
  }

  // 3. Verify
  const verifyRes = await pool.query('SELECT id, title, author, "preorderLink" FROM "book_release"');
  console.log('Verification count:', verifyRes.rows.length);
  console.log(JSON.stringify(verifyRes.rows, null, 2));

  await pool.end();
  console.log('✅ Seeding completed successfully!');
}

main().catch(err => {
  console.error('❌ Error seeding books:', err);
  process.exit(1);
});
