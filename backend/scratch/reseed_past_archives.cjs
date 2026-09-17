const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

const newPastArchiveEvents = [
  // ─── YOUTUBE VIDEO EVENTS (Only VideoUrl + Single Cover, NO multiple images) ───
  {
    id: 'evt-archive-vid-1',
    type: 'PAST_ARCHIVE',
    title: 'Akam Annual Literary Meet 2025: Keynote & Recitals',
    description: 'Complete video recording of the inaugural annual literary convention celebrating Malayalam prose, featuring keynote addresses and panel deliberations.',
    location: 'Trivandrum Public Library Auditorium',
    time: '10:00 AM',
    day: '15',
    monthYear: 'Jan 2025',
    imageSrc: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
    images: [],
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    registerHref: null,
    isPublished: true,
  },
  {
    id: 'evt-archive-vid-2',
    type: 'PAST_ARCHIVE',
    title: 'Poetry in Translation: Crossing Cultural Boundaries',
    description: 'Full session video from the symposium on the art of translating Malayalam poetic meters and cultural metaphors into world languages.',
    location: 'Calicut Town Hall & Stream',
    time: '04:00 PM',
    day: '10',
    monthYear: 'Feb 2025',
    imageSrc: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
    images: [],
    videoUrl: 'https://www.youtube.com/watch?v=L_LUpnjgPso',
    registerHref: null,
    isPublished: true,
  },
  {
    id: 'evt-archive-vid-3',
    type: 'PAST_ARCHIVE',
    title: 'Documentary Screening: River Stories of Nila',
    description: 'Watch the documented screening and post-film dialogue with documentary filmmakers exploring folk traditions and riverside narratives of Bharathappuzha.',
    location: 'Kochi Heritage Arts Cafe',
    time: '06:30 PM',
    day: '20',
    monthYear: 'Mar 2025',
    imageSrc: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800',
    images: [],
    videoUrl: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
    registerHref: null,
    isPublished: true,
  },

  // ─── PHOTO GALLERY EVENTS (Multiple Images, NO VideoUrl) ───
  {
    id: 'evt-archive-gal-1',
    type: 'PAST_ARCHIVE',
    title: 'Monsoon Metaphors: Photo Retrospective',
    description: 'Visual retrospective and exhibition captures from the evening prose reading and acoustic recital gathering held during the peak Kerala monsoon.',
    location: 'Fort Kochi Art Pavilion',
    time: '05:00 PM',
    day: '18',
    monthYear: 'Jun 2025',
    imageSrc: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: null,
    registerHref: null,
    isPublished: true,
  },
  {
    id: 'evt-archive-gal-2',
    type: 'PAST_ARCHIVE',
    title: 'Literary Translation & Craft Residency Gallery',
    description: 'Curated photographic journey capturing the intense 3-day translation workshop, author mentoring sessions, and manuscript roundtables at Calicut.',
    location: 'Calicut Heritage Centre',
    time: '11:00 AM',
    day: '14',
    monthYear: 'Aug 2025',
    imageSrc: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: null,
    registerHref: null,
    isPublished: true,
  },
  {
    id: 'evt-archive-gal-3',
    type: 'PAST_ARCHIVE',
    title: 'Contemporary Typography & Book Cover Expo',
    description: 'Exhibition highlights showcasing bespoke Malayalam typographic cover designs, letterpress prints, and creative layout explorations.',
    location: 'Kottayam Press Club Gallery',
    time: '02:00 PM',
    day: '28',
    monthYear: 'Nov 2025',
    imageSrc: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800',
    images: [
      'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: null,
    registerHref: null,
    isPublished: true,
  }
];

async function reseedPastArchives() {
  console.log('🔄 Cleaning up old PAST_ARCHIVE events and reseeding new ones...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Remove only existing PAST_ARCHIVE events
    const deleteResult = await client.query('DELETE FROM "event" WHERE type = $1', ['PAST_ARCHIVE']);
    console.log(`🗑️ Removed ${deleteResult.rowCount} existing PAST_ARCHIVE events.`);

    const insertQuery = `
      INSERT INTO "event" (
        "id", "type", "title", "description", "location", "time", "day", "monthYear",
        "imageSrc", "images", "videoUrl", "registerHref", "isPublished", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
    `;

    for (const ev of newPastArchiveEvents) {
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
    console.log(`✅ Successfully seeded ${newPastArchiveEvents.length} fresh PAST_ARCHIVE events!`);

    const summary = await client.query(`
      SELECT id, title, "videoUrl", array_length(images, 1) as gallery_image_count
      FROM "event"
      WHERE type = 'PAST_ARCHIVE'
      ORDER BY id
    `);
    console.table(summary.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Failed to reseed past archives:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

reseedPastArchives();
