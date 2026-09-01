import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

const AUTHORS = [
  { name: 'M. T. Vasudevan Nair', email: 'mt@akamdigital.com', bio: 'Renowned Malayalam novelist and screenwriter, Jnanpith laureate.' },
  { name: 'Benyamin', email: 'benyamin@akamdigital.com', bio: 'Malayalam novelist and short story writer, author of Goat Days.' },
  { name: 'K. R. Meera', email: 'krmeera@akamdigital.com', bio: 'Acclaimed Malayalam author and journalist, Sahitya Akademi winner.' },
  { name: 'Santhosh Echikkanam', email: 'santhosh@akamdigital.com', bio: 'Contemporary Malayalam short story writer and screenwriter.' },
  { name: 'Subhash Chandran', email: 'subhash@akamdigital.com', bio: 'Malayalam author, journalist, and Kendra Sahitya Akademi awardee.' },
  { name: 'Sarah Joseph', email: 'sarah@akamdigital.com', bio: 'Pioneering Malayalam novelist and feminist writer.' },
  { name: 'N. S. Madhavan', email: 'nsmadhavan@akamdigital.com', bio: 'Distinguished Malayalam fiction writer and essayist.' },
  { name: 'K. Sachidanandan', email: 'sachidanandan@akamdigital.com', bio: 'Renowned Indian poet, critic, and bilingual essayist.' },
];

const CATEGORIES = ['Fiction', 'Non-Fiction', 'Poetry', 'Culture', 'Technology', 'Opinion', 'Literature', 'General'];

const COVER_IMAGES = [
  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1476275466078-4007374efbbe?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=800&q=80',
];

const STORY_TEMPLATES = [
  {
    title: 'തീരത്തെ കാറ്റ് (The Shore Breeze)',
    content: `കടലിന്റെ കറുത്ത തരംഗങ്ങൾ കരയിലേക്ക് അടിച്ചുകയറുകയായിരുന്നു. വൈകുന്നേരത്തെ തണുത്ത കാറ്റിൽ പഴയ പ്രകാശഗോപുരത്തിന്റെ നിഴൽ നീണ്ടുവന്നു.\n\nഅയാൾ കടൽത്തീരത്തെ മരബഞ്ചിൽ ഒറ്റക്കിരുന്നു. അക്കരെയെങ്ങോ മാഞ്ഞുപോകുന്ന സൂര്യന്റെ ചുവന്ന ശോഭ ആകാശത്ത് പടരുകയായിരുന്നു. ബാല്യകാലത്തെ ഓർമ്മകൾ തരംഗങ്ങൾപോലെ മനസ്സിൽ അലയടിച്ചു.\n\n"തീരത്ത് കാറ്റുള്ളപ്പോൾ ഓർമ്മകൾക്ക് ഭാരം കൂടുതലാണ്," പഴയ മാസ്റ്റർ പറയുമായിരുന്നു. ചിന്തകളുടെ ആഴത്തിൽനിന്ന് ഉണരുമ്പോൾ കടൽ കൂടുതൽ നിശബ്ദമായിക്കഴിഞ്ഞിരുന്നു.`
  },
  {
    title: 'പഴയ ഗ്രാമത്തിന്റെ പാതകൾ',
    content: `മഴ തോർന്ന സന്ധ്യയിൽ മൺപാതയിൽ ഈറൻ മണം പടർന്നുനിൽക്കുകയാണ്. ഇരുകരകളിലും പച്ചപ്പുതച്ച നെൽപ്പാടങ്ങൾ കാറ്റിൽ തലയാട്ടുന്നു.\n\nനാട്ടിൻപുറത്തെ പഴയ അങ്ങാടിയിൽ ചായക്കടയിലെ വെളിച്ചം മങ്ങിത്തുടങ്ങി. ആവിപറക്കുന്ന ചായക്കോപ്പയുമായി ആളുകൾ ലോകകാര്യങ്ങൾ ചർച്ചചെയ്യുകയാണ്.\n\nകാലം മാറിയെങ്കിലും ഈ വഴികൾക്ക് ഇന്നും പഴയ സ്നേഹത്തിന്റെ ഈണമുണ്ട്. കാറ്റിന്റെ സംഗീതത്തിൽ ഗ്രാമം ഉറക്കത്തിലേക്ക് വഴുതിവീണു.`
  },
  {
    title: 'രാത്രിയിലെ തീവണ്ടി (Midnight Train)',
    content: `നിശബ്ദമായ പ്ലാറ്റ്‌ഫോമിലേക്ക് ഇരുമ്പുചക്രങ്ങളുടെ ശബ്ദത്തോടെ ആ തീവണ്ടി വന്നുനിന്നു. മഞ്ഞുവെളിച്ചത്തിൽ ജനലുകളിലൂടെ വെളിച്ചത്തിന്റെ വരകൾ നീണ്ടു.\n\nയാത്രക്കാർ ഓരോരുത്തരായി കയറിപ്പറ്റി. ഓരോ പെട്ടിയിലും പുതിയ കഥകളും പ്രതീക്ഷകളും പേറുന്ന മനുഷ്യരായിരുന്നു.\n\nവണ്ടി വീണ്ടും ചലിച്ചുതുടങ്ങി. ഇരുട്ടിലൂടെ ദൂരേക്ക് മറയുമ്പോൾ റെയിൽപ്പാളങ്ങളിലെ ശബ്ദം മാത്രം രാത്രിയിൽ മുഴങ്ങിനിൽക്കുകയായിരുന്നു.`
  },
  {
    title: 'പുസ്തകശാലയിലെ നിഴലുകൾ',
    content: `പഴയ തെരുവിലെ കൊച്ചു പുസ്തകശാലയിൽ കടലാസിന്റെയും മഷിയുടെയും സവിശേഷമായ മണം നിറഞ്ഞുനിന്നു. അലമാരകളിൽ അടുക്കിവെച്ച ആയിരക്കണക്കിന് പുസ്തകങ്ങൾ നിശബ്ദമായി സംസാരിക്കുന്നതുപോലെ തോന്നി.\n\nവൃദ്ധനായ കടയുടമ കണ്ണടയിലൂടെ പുതുതായി വന്ന പുസ്തകത്തിന്റെ താളുകൾ മറിച്ചുനോക്കുകയാണ്. ഓരോ വായനക്കാരനും ഈ കടയൊരു അഭയകേന്ദ്രമായിരുന്നു.\n\nഅവിടെ ചെലവഴിക്കുന്ന ഓരോ നിമിഷവും ഭൂതകാലത്തിന്റെ ഏതോ ഏടുകളിലേക്ക് വായനക്കാരനെ കൂട്ടിക്കൊണ്ടുപോയി.`
  },
  {
    title: 'മഴയൊഴിയാത്ത മലനിരകൾ',
    content: `മഞ്ഞിന്റെ വെളുത്ത പുകച്ചുരുളുകൾ മലനിരകളെ മൂടിപ്പുതപ്പിച്ചിരിക്കുകയാണ്. കാട്ടുചോലകളുടെ കുളിർമ്മയുള്ള ശബ്ദം താഴ്‌വരയിൽ മുഴങ്ങി കേൾക്കാം.\n\nകുന്നിൻമുകളിലെ ചെറിയ തയ്യൽക്കടയിൽ തയ്യൽമെഷീന്റെ ശബ്ദം വീണ്ടും കേട്ടുതുടങ്ങി. ചാറ്റൽമഴ വീണ്ടും പെയ്യാൻ തുടങ്ങിയപ്പോൾ ആകാശത്തിന്റെ നിറം കറുത്തു.\n\nപ്രകൃതിയുടെ ഈ ശാന്തത മനസ്സിലേക്ക് പുതിയൊരു വെളിച്ചം പകരുകയായിരുന്നു.`
  }
];

async function seed50Stories() {
  console.log('🚀 Starting to seed ~50 dynamic stories into PostgreSQL database...');

  // 1. Ensure author users exist
  const authorIds: string[] = [];
  for (const author of AUTHORS) {
    const res = await pool.query(
      `INSERT INTO "user" (id, email, name, bio, role, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'AUTHOR'::"Role", NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET name = $2, bio = $3, role = 'AUTHOR'::"Role", "updatedAt" = NOW()
       RETURNING id;`,
      [author.email, author.name, author.bio]
    );
    authorIds.push(res.rows[0].id);
  }

  console.log(`✅ ${authorIds.length} Author profiles ready.`);

  // 2. Clear previous stories if requested or insert 50 new stories
  let insertedCount = 0;

  for (let i = 1; i <= 50; i++) {
    const template = STORY_TEMPLATES[(i - 1) % STORY_TEMPLATES.length];
    const category = CATEGORIES[(i - 1) % CATEGORIES.length];
    const authorId = authorIds[(i - 1) % authorIds.length];
    const coverImage = COVER_IMAGES[(i - 1) % COVER_IMAGES.length];

    const title = `${template.title} #${i}`;
    const slug = `story-${i}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const content = template.content;

    await pool.query(
      `INSERT INTO story (id, title, slug, content, category, "coverImageUrl", status, "authorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'APPROVED'::"StoryStatus", $6, NOW() - ($7 || ' days')::INTERVAL, NOW())
       ON CONFLICT (slug) DO NOTHING;`,
      [title, slug, content, category, coverImage, authorId, (50 - i).toString()]
    );

    insertedCount++;
  }

  console.log(`🎉 Successfully seeded ${insertedCount} published stories!`);

  // Print summary count
  const countRes = await pool.query(`SELECT COUNT(*) FROM story WHERE status = 'APPROVED';`);
  console.log(`📊 Total Approved Stories in Database: ${countRes.rows[0].count}`);

  await pool.end();
}

seed50Stories().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
