import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

async function main() {
  console.log('--- Reseeding all events ---');
  await pool.query(`DELETE FROM "event"`);
  await pool.query(`
    INSERT INTO "event" ("id", "type", "title", "description", "location", "time", "day", "monthYear", "imageSrc", "isPublished")
    VALUES
      ('evt-1', 'READING_SESSION', 'Voices of Classic Malayalam Short Stories', 'A curated session featuring vocal renditions of iconic Malayalam short stories alongside critical literary insights.', 'Trivandrum Public Library & Online Stream', '04:00 PM', '23', 'Aug 2026', NULL, true),
      ('evt-2', 'READING_SESSION', 'Malayalam Poetry & Modern Recitals', 'A live reading session bringing together contemporary poets reciting original works with orchestral ambient music.', 'Trivandrum Public Library & Online Stream', '04:00 PM', '29', 'Aug 2026', NULL, true),
      ('evt-3', 'DISCUSSION', 'Contemporary Fiction & Narrative Shifts', 'A round-table discussion with modern novelists discussing regional aesthetics and global translations.', 'Kochi Cultural Center & Live Stream', '05:30 PM', '04', 'Sep 2026', NULL, true),
      ('evt-4', 'DISCUSSION', 'Poetry Recitals & Critical Dialogue', 'An evening of poetry readings accompanied by critical commentaries from leading Malayalam literary scholars.', 'Calicut Town Hall & Live Stream', '06:00 PM', '12', 'Sep 2026', NULL, true),
      ('evt-5', 'WORKSHOP', 'Malayalam Creative Writing Masterclass', 'A hands-on interactive session on character development, narrative pacing, and modern storytelling techniques led by published authors.', 'Calicut Town Hall & Online Stream', '02:00 PM', '21', 'Oct 2026', '/images/workshops/writing-masterclass.jpg', true),
      ('evt-6', 'WORKSHOP', 'Literary Translation & Craft Workshop', 'Practical exercises and guidance on translating Malayalam prose and poetry into global languages while preserving nuanced cultural themes.', 'Calicut Town Hall & Online Stream', '02:00 PM', '29', 'Oct 2026', '/images/workshops/translation-workshop.jpg', true),
      ('evt-7', 'PAST_ARCHIVE', 'Akam Annual Literary Meet 2025', 'A recording of the inaugural annual convention celebrating classic Malayalam novelists, featuring keynote addresses and live readings.', 'Trivandrum Public Library Auditorium', NULL, '15', 'Jan 2025', '/images/past-events/annual-literary-meet.jpg', true),
      ('evt-8', 'PAST_ARCHIVE', 'Poetry in Translation: Crossing Boundaries', 'Archived panel discussion on the nuances of translating traditional Malayalam verse into global languages without losing rhythmic essence.', 'Calicut Town Hall & Online Stream', NULL, '10', 'Feb 2025', '/images/past-events/poetry-translation.jpg', true);
  `);
  console.log('✅ All 8 events reseeded successfully!');
  await pool.end();
}

main().catch(console.error);
