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
    coverImage: 'https://kairalibooks.com/wp-content/uploads/2024/09/Sworgasthanaya-3.jpg',
    preorderLink: 'https://kairalibooks.com/product/swargasthanaya-gandhiji/',
    isPublished: true,
  },
  {
    id: 'book-peythozhinja-varshangal',
    title: 'Peythozhinja Varshangal',
    author: 'Mahalakshmi Manoj',
    editionTag: 'Print Edition',
    description: 'ലാളിത്യത്തിന്റെ ഭംഗിയാണ് മഹാലക്ഷ്മി മനോജിന്റെ കഥകളെ ശ്രദ്ധേയമാക്കുന്നത്. പ്രവാസിയായി ജീവിക്കുമ്പോഴും നാട്ടോർമ്മകളിലൂടെ സഞ്ചരിക്കാൻ കൊതിക്കുന്നു ഈ എഴുത്തുകാരി. ഗൃഹാതുരത്വത്തിന്റെ അടയാളങ്ങൾ ഈ കഥകളിൽ നിറഞ്ഞു നിൽക്കുന്നു.',
    coverImage: 'https://kairalibooks.com/wp-content/uploads/2022/11/Peythozhinja-Meghangal.jpg',
    preorderLink: 'https://kairalibooks.com/product/peythozhinja-varshangal/',
    isPublished: true,
  },
  {
    id: 'book-cheruvallikkattile-chengayimar',
    title: 'Cheruvallikkattile Chengayimar',
    author: 'P. I. Mini',
    editionTag: 'Print Edition',
    description: 'സുന്ദരമായ ചെറുവള്ളിക്കാട്ടിന്റെ പശ്ചാത്തലത്തിൽ കുട്ടികൾക്ക് വേണ്ടി രചിക്കപ്പെട്ട മനോഹരമായ നോവൽ. കുട്ടികളിൽ ഒരാളായി കഥ പറഞ്ഞു പോകുന്ന കഥന രീതിയിലൂടെ വളരെ ലളിതമായ ഭാഷയിൽ കാടിനെയും കാട്ടിലെ നമ്മുടെ സഹജീവികളുടെയും കഥ ആവിഷ്കരിച്ചിരിക്കുന്നു.',
    coverImage: 'https://kairalibooks.com/wp-content/uploads/2022/09/Cheruvallikkattile.jpg',
    preorderLink: 'https://kairalibooks.com/product/cheruvallikkattile-chengayimar/',
    isPublished: true,
  },
  {
    id: 'book-aadujeevitham',
    title: 'Aadujeevitham (Goat Days)',
    author: 'Benyamin',
    editionTag: 'Special Collector Edition',
    description: 'നജീബിന്റെ അസാധാരണ അതിജീവനത്തിന്റെ ആഖ്യാനം. മരുഭൂമിയിലെ ഏകാന്തതയും പീഡനങ്ങളും അതിജീവിച്ച മനുഷ്യന്റെ ഹൃദയസ്പർശിയായ കഥ.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    preorderLink: 'https://kairalibooks.com/product/aadujeevitham/',
    isPublished: true,
  },
  {
    id: 'book-khasakkinte-ithihasam',
    title: 'Khasakkinte Ithihasam',
    author: 'O. V. Vijayan',
    editionTag: 'Hardcover Classic',
    description: 'തസ്രാക്കിന്റെ പശ്ചാത്തലത്തിൽ വിരചിതമായ മലയാള നോവൽ സാഹിത്യത്തിലെ എക്കാലത്തെയും മഹത്തായ ക്ലാസിക് കൃതി. രവി എന്ന ചെറുപ്പക്കാരന്റെ ആത്മീയവും ദാർശനികവുമായ അലച്ചിലുകൾ.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&auto=format&fit=crop&q=80',
    preorderLink: 'https://kairalibooks.com/product/khasakkinte-ithihasam/',
    isPublished: true,
  },
  {
    id: 'book-ente-katha',
    title: 'Ente Katha (My Story)',
    author: 'Kamala Surayya',
    editionTag: 'Golden Edition',
    description: 'മാധവിക്കുട്ടിയുടെ ആത്മകഥാംശമുള്ള അനശ്വര കൃതി. തുറന്നെഴുത്തിന്റെയും തീക്ഷ്ണമായ അനുഭവങ്ങളുടെയും തുറന്ന പുസ്തകം.',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600&auto=format&fit=crop&q=80',
    preorderLink: 'https://kairalibooks.com/product/ente-katha/',
    isPublished: true,
  },
  {
    id: 'book-mathilukal',
    title: 'Mathilukal',
    author: 'Vaikom Muhammad Basheer',
    editionTag: 'Illustrated Edition',
    description: 'സെൻട്രൽ ജയിലിന്റെ മതിലുകൾക്കിടയിൽ തളിരിട്ട അപൂർവ്വമായ പ്രണയത്തിന്റെ അനുപമമായ ബഷീറിയൻ ആവിഷ്കാരം.',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&auto=format&fit=crop&q=80',
    preorderLink: 'https://kairalibooks.com/product/mathilukal/',
    isPublished: true,
  },
  {
    id: 'book-oru-deshathinte-katha',
    title: 'Oru Deshathinte Katha',
    author: 'S. K. Pottekkatt',
    editionTag: 'Print Edition',
    description: 'ജ്ഞാനപീഠ പുരസ്കാരം നേടിയ എസ്.കെ. പൊറ്റെക്കാട്ടിന്റെ അനശ്വര കൃതി. അതിരാണിപ്പാടം ഗ്രാമത്തിന്റെ ജീവസ്സുറ്റ ചരിത്രം.',
    coverImage: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=600&auto=format&fit=crop&q=80',
    preorderLink: 'https://kairalibooks.com/product/oru-deshathinte-katha/',
    isPublished: true,
  },
  {
    id: 'book-manushyanu-oru-aamukham',
    title: 'Manushyanu Oru Aamukham',
    author: 'Subhash Chandran',
    editionTag: 'Digital & Print',
    description: 'തുമ്പോർ ഗ്രാമത്തിലെ താച്ചനാക്കര കുടുംബത്തിന്റെ നൂറ്റാണ്ടിന്റെ ചരിത്രം പറയുന്ന കേന്ദ്ര സാഹിത്യ അക്കാദമി പുരസ്കാരം നേടിയ നോവൽ.',
    coverImage: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=600&auto=format&fit=crop&q=80',
    preorderLink: 'https://kairalibooks.com/product/manushyanu-oru-aamukham/',
    isPublished: false,
  },
  {
    id: 'book-mayyazhippuzhayude-theerangalil',
    title: 'Mayyazhippuzhayude Theerangalil',
    author: 'M. Mukundan',
    editionTag: 'Special Edition',
    description: 'ഫ്രഞ്ച് ഭരണത്തിന് കീഴിലായിരുന്ന മയ്യഴിയുടെ പശ്ചാത്തലത്തിൽ ദാസന്റെയും ചന്ദ്രികയുടെയും വികാരതീവ്രമായ കഥ.',
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=600&auto=format&fit=crop&q=80',
    preorderLink: 'https://kairalibooks.com/product/mayyazhippuzhayude-theerangalil/',
    isPublished: true,
  },
];

async function main() {
  console.log('--- Seeding Books in Database ---');

  // 1. Remove current data
  const delRes = await pool.query('DELETE FROM "book_release"');
  console.log(`Deleted ${delRes.rowCount} previous book release records.`);

  // 2. Insert new books
  for (let i = 0; i < books.length; i++) {
    const b = books[i];
    await pool.query(
      `INSERT INTO "book_release" ("id", "title", "author", "editionTag", "description", "coverImage", "preorderLink", "isPublished", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW() - ($9 || ' minutes')::INTERVAL, CURRENT_TIMESTAMP)`,
      [b.id, b.title, b.author, b.editionTag, b.description, b.coverImage, b.preorderLink, b.isPublished, i * 5]
    );
    console.log(`Inserted book: "${b.title}" (published: ${b.isPublished})`);
  }

  // 3. Verify
  const verifyRes = await pool.query('SELECT count(*)::int as total FROM "book_release"');
  console.log('✅ Seeding completed! Total books in database:', verifyRes.rows[0].total);

  await pool.end();
}

main().catch(err => {
  console.error('❌ Error seeding books:', err);
  process.exit(1);
});
