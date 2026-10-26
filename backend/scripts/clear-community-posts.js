/**
 * Script to clear community posts from the database.
 * 
 * Usage:
 *   node scripts/clear-community-posts.js              # Clears ALL community posts across all communities
 *   node scripts/clear-community-posts.js <slug>       # Clears posts for a specific community slug
 * 
 * Examples:
 *   node scripts/clear-community-posts.js
 *   node scripts/clear-community-posts.js fiction-serialized-novels
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env if available
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DATABASE_URI ||
  'postgres://postgres.rwncydntaqmznrzwjthq:8Wt8esokF0kdZZjz@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

const targetSlug = process.argv[2]?.trim();

async function run() {
  const client = new pg.Client({ connectionString });
  console.log('Connecting to database...');
  await client.connect();
  console.log('Connected successfully.\n');

  try {
    if (targetSlug && targetSlug !== 'all') {
      // Clear posts for specific community
      console.log(`Checking community with slug: "${targetSlug}"...`);
      const commRes = await client.query('SELECT id, name, slug FROM community WHERE slug = $1', [targetSlug]);
      if (commRes.rows.length === 0) {
        console.error(`Community with slug "${targetSlug}" not found!`);
        process.exit(1);
      }

      const community = commRes.rows[0];
      const countRes = await client.query(
        'SELECT COUNT(*) as count FROM community_post WHERE "communityId" = $1',
        [community.id]
      );
      const postCount = parseInt(countRes.rows[0].count, 10);
      console.log(`Found ${postCount} post(s) in community "${community.name}" (r/${community.slug}).`);

      if (postCount > 0) {
        // Cascade delete removes child comments, votes, reports
        await client.query('DELETE FROM community_post WHERE "communityId" = $1', [community.id]);
        await client.query(
          'UPDATE community SET "postCount" = 0, "updatedAt" = now() WHERE id = $1',
          [community.id]
        );
        console.log(`Successfully deleted ${postCount} post(s) from "${community.name}".`);
      } else {
        console.log(`No posts to delete for "${community.name}".`);
      }
    } else {
      // Clear ALL community posts
      const countRes = await client.query('SELECT COUNT(*) as count FROM community_post');
      const totalPosts = parseInt(countRes.rows[0].count, 10);
      console.log(`Found ${totalPosts} total community post(s) across all communities.`);

      if (totalPosts > 0) {
        // Delete all posts
        await client.query('DELETE FROM community_post');
        await client.query('UPDATE community SET "postCount" = 0, "updatedAt" = now()');
        console.log(`Successfully cleared all ${totalPosts} community post(s).`);
      } else {
        console.log('Community posts table is already empty.');
      }
    }

    // Print summary of remaining communities and their post counts
    console.log('\nCurrent Community Status:');
    const summaryRes = await client.query('SELECT slug, name, "postCount" FROM community ORDER BY name ASC');
    console.table(summaryRes.rows);
    console.log('\nDone!');
  } catch (err) {
    console.error('Error clearing community posts:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
