const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

const events = [
  // ─── 1. READING SESSIONS ────────────────────────────────────────────────────
  {
    id: 'evt-reading-1',
    type: 'READING_SESSION',
    title: 'Voices of Classic Malayalam Short Stories',
    description: 'An intimate literary session celebrating iconic Malayalam prose masters. Experienced narrators will deliver dramatic vocal readings from celebrated works, followed by an open discussion on narrative subtleties and cultural memories.',
    location: 'Trivandrum Public Library & Online Stream',
    time: '04:00 PM',
    day: '24',
    monthYear: 'Oct 2026',
    imageSrc: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/reading-1',
    isPublished: true,
  },
  {
    id: 'evt-reading-2',
    type: 'READING_SESSION',
    title: 'Malayalam Poetry & Modern Recitals',
    description: 'An evening of rhythmic recitals featuring contemporary poets reading original poems alongside acoustic string accompaniments. Explores modern themes of displacement, identity, and ecological consciousness in Malayalam verse.',
    location: 'Kochi Cultural Centre & Live Stream',
    time: '05:30 PM',
    day: '15',
    monthYear: 'Nov 2026',
    imageSrc: 'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1474932430478-367dbb6832c1?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/reading-2',
    isPublished: true,
  },

  // ─── 2. DISCUSSIONS ─────────────────────────────────────────────────────────
  {
    id: 'evt-disc-1',
    type: 'DISCUSSION',
    title: 'Contemporary Fiction & Narrative Shifts',
    description: 'A panel of award-winning novelists and scholars debating how Malayalam novel structure has transformed over the past decade. Focuses on local geography, linguistic experimentation, and crossing frontiers through English and world translations.',
    location: 'Calicut Town Hall & Live Stream',
    time: '06:00 PM',
    day: '08',
    monthYear: 'Nov 2026',
    imageSrc: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/disc-1',
    isPublished: true,
  },
  {
    id: 'evt-disc-2',
    type: 'DISCUSSION',
    title: 'Literary Criticism in the Digital Era',
    description: 'Exploring how literary evaluation has evolved from classical journals to digital newsletters, podcasts, and social communities. Prominent cultural commentators examine democratic readership vs critical rigor.',
    location: 'Thrissur Sahitya Akademi Hall & Online',
    time: '05:00 PM',
    day: '22',
    monthYear: 'Nov 2026',
    imageSrc: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/disc-2',
    isPublished: true,
  },

  // ─── 3. WORKSHOPS ───────────────────────────────────────────────────────────
  {
    id: 'evt-ws-1',
    type: 'WORKSHOP',
    title: 'Malayalam Creative Writing Masterclass',
    description: 'An interactive 2-day workshop on building living characters, scene momentum, subtext, and authentic dialogue in Malayalam fiction. Participants will work on real story prompts with guided feedback from veteran authors.',
    location: 'Kerala Media Academy, Kochi',
    time: '10:00 AM',
    day: '05',
    monthYear: 'Dec 2026',
    imageSrc: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/workshop-1',
    isPublished: true,
  },
  {
    id: 'evt-ws-2',
    type: 'WORKSHOP',
    title: 'The Art of Literary Translation',
    description: 'Practical training on the craft of translating Malayalam idioms, cultural nuances, humor, and poetic resonance into English and European languages. Suitable for bilingual writers, editors, and students of comparative literature.',
    location: 'Trivandrum Press Club & Online Stream',
    time: '02:00 PM',
    day: '19',
    monthYear: 'Dec 2026',
    imageSrc: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/workshop-2',
    isPublished: true,
  },

  // ─── 4. EXHIBITIONS ─────────────────────────────────────────────────────────
  {
    id: 'evt-exh-1',
    type: 'EXHIBITION',
    title: 'Rare Malayalam Manuscripts & Printing Archive',
    description: 'A rare physical and digital exhibition featuring palm-leaf manuscripts, earliest print editions produced by CMS Press Kottayam, original lithographs, and handwritten correspondence of pioneer Kerala writers.',
    location: 'Durbar Hall Art Gallery, Kochi',
    time: '10:30 AM - 07:00 PM',
    day: '12',
    monthYear: 'Dec 2026',
    imageSrc: 'https://images.unsplash.com/photo-1507842229451-7f01be837402?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1507842229451-7f01be837402?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/exhibition-1',
    isPublished: true,
  },
  {
    id: 'evt-exh-2',
    type: 'EXHIBITION',
    title: 'Illustrated Cover Art & Typography of Malayalam Literature',
    description: 'Celebrating seven decades of literary illustration, calligraphic font design, and magazine cover aesthetics that defined Malayalam cultural publications. Includes guided curator walkthroughs twice daily.',
    location: 'Lalit Kala Akademi Art Gallery, Calicut',
    time: '11:00 AM - 06:30 PM',
    day: '28',
    monthYear: 'Dec 2026',
    imageSrc: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/exhibition-2',
    isPublished: true,
  },

  // ─── 5. FILM SCREENINGS ─────────────────────────────────────────────────────
  {
    id: 'evt-film-1',
    type: 'FILM_SCREENING',
    title: 'Literary Adaptations in Malayalam Parallel Cinema',
    description: 'Special screening of celebrated Malayalam arthouse films adapted from seminal short stories and novels, followed by an in-depth conversation on cinematic translation with film critics and guest screenwriters.',
    location: 'Kairali Theatre Complex, Trivandrum',
    time: '06:00 PM',
    day: '10',
    monthYear: 'Jan 2027',
    imageSrc: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/film-1',
    isPublished: true,
  },
  {
    id: 'evt-film-2',
    type: 'FILM_SCREENING',
    title: 'Documentary: Words Unbroken – The Life of MT',
    description: 'Feature-length documentary tracing the life, literature, and cinematic legacy of M.T. Vasudevan Nair. Includes rare interview archives, scenic explorations of Kudallur, and reflections from contemporary literary masters.',
    location: 'Tagore Centenary Hall, Calicut',
    time: '05:30 PM',
    day: '24',
    monthYear: 'Jan 2027',
    imageSrc: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&q=80&w=800'],
    videoUrl: null,
    registerHref: 'https://akam.digital/events/register/film-2',
    isPublished: true,
  },

  // ─── 6. PAST ARCHIVES ───────────────────────────────────────────────────────
  {
    id: 'evt-archive-1',
    type: 'PAST_ARCHIVE',
    title: 'Akam Annual Literary Meet 2025',
    description: 'Full video archive and photographic retrospective of the inaugural Akam literary convention. Keynote speeches by eminent Kerala writers, poetry recital stages, and discussions on the digital preservation of regional heritage.',
    location: 'Trivandrum Public Library Auditorium',
    time: '10:00 AM - 08:00 PM',
    day: '15',
    monthYear: 'Jan 2025',
    imageSrc: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    registerHref: null,
    isPublished: true,
  },
  {
    id: 'evt-archive-2',
    type: 'PAST_ARCHIVE',
    title: 'Poetry in Translation: Crossing Boundaries',
    description: 'Archived recording and gallery from the international symposium exploring the hurdles and triumphs of translating intricate Malayalam meter, local idioms, and philosophical cadence into world languages.',
    location: 'Calicut Town Hall & Online Stream',
    time: '04:00 PM',
    day: '10',
    monthYear: 'Feb 2025',
    imageSrc: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    registerHref: null,
    isPublished: true,
  },
  {
    id: 'evt-archive-3',
    type: 'PAST_ARCHIVE',
    title: 'Monsoon Metaphors: Evening Prose Reading',
    description: 'Archived recording from our heritage arts cafe session featuring live acoustic violin recitals and readings of rain-soaked monsoon memoirs by classic and contemporary authors.',
    location: 'Kochi Heritage Arts Cafe',
    time: '06:30 PM',
    day: '20',
    monthYear: 'Jun 2025',
    imageSrc: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1460518451282-474b15672083?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    registerHref: null,
    isPublished: true,
  },
  {
    id: 'evt-archive-4',
    type: 'PAST_ARCHIVE',
    title: 'Literary Translation & Craft Intensive 2025',
    description: 'Comprehensive documentation, participant reviews, and photo reel from the winter translation residency held at Calicut with international translators.',
    location: 'Calicut Heritage Centre',
    time: '11:00 AM',
    day: '14',
    monthYear: 'Dec 2025',
    imageSrc: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    registerHref: null,
    isPublished: true,
  }
];

async function seedEvents() {
  console.log('🔄 Cleaning up and seeding events for all categories...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM "event"');

    const insertQuery = `
      INSERT INTO "event" (
        "id", "type", "title", "description", "location", "time", "day", "monthYear",
        "imageSrc", "images", "videoUrl", "registerHref", "isPublished", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
    `;

    for (const ev of events) {
      await client.query(insertQuery, [
        ev.id,
        ev.type,
        ev.title,
        ev.description,
        ev.location,
        ev.time,
        ev.day,
        ev.monthYear,
        ev.imageSrc,
        ev.images,
        ev.videoUrl,
        ev.registerHref,
        ev.isPublished,
      ]);
    }

    await client.query('COMMIT');
    console.log(`✅ Successfully seeded ${events.length} events across all 6 categories!`);

    const summary = await client.query(`
      SELECT type, COUNT(*) as count 
      FROM "event" 
      GROUP BY type 
      ORDER BY type
    `);
    console.table(summary.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to seed events:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedEvents();
