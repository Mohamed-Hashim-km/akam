import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const samplePosts: Record<string, { title: string; body: string; flair: string }[]> = {
  'childrens-literature': [
    {
      title: "The Magic Palm Leaf: A Children's Tale of Wonder",
      body: "Illustrated story about young Appu discovering a magical palm leaf manuscript in his grandmother's attic that brings ancient fables to life.",
      flair: "DISCUSSION",
    },
    {
      title: "Recommended reading list for young readers (Ages 7-12)",
      body: "Here is a curated list of Malayalam and translated children's books that spark imagination and curiosity.",
      flair: "RESOURCE",
    },
  ],
  'fiction-serialized-novels': [
    {
      title: "Antigravity Chronicles: Episode 1 — The Quantum Quill",
      body: "Chapter 1 of my new serialized novel. In a world where gravity is governed by words written on ancient parchment, a young scribe discovers a lost ink formula.",
      flair: "ANNOUNCEMENT",
    },
    {
      title: "How do you structure long-form serialized fiction pacing?",
      body: "Looking for feedback from fellow authors on cliffhangers vs episodic resolution in weekly releases.",
      flair: "QUESTION",
    },
  ],
  'malayalam-literature': [
    {
      title: "Deep Literary Analysis of Thakazhi's Chemmeen",
      body: "Exploring the mythic themes, social realism, and romantic tragedy in Thakazhi Sivasankara Pillai's classic work.",
      flair: "DISCUSSION",
    },
  ],
  'novella': [
    {
      title: "Crafting High-Impact Concise Narratives",
      body: "Why the novella length (20,000 to 40,000 words) is the perfect medium for modern digital readers seeking deep storytelling without epic commitments.",
      flair: "FEEDBACK",
    },
  ],
  'poetry-masika': [
    {
      title: "Echoes of the River: Contemporary Free Verse Edition",
      body: "A collection of 5 short poems submitted for this month's Masika digital edition. Feedback and critiques welcome!",
      flair: "DISCUSSION",
    },
  ],
  'tech-digital-culture': [
    {
      title: "The Intersection of AI, Antigravity Ideas, and Literary Future",
      body: "How digital platforms, neural language models, and interactive community forums are reshaping how stories are created and shared.",
      flair: "RESOURCE",
    },
  ],
  'translations': [
    {
      title: "Translating Nuance: Bridging Malayalam Idioms into English",
      body: "A discussion on preserving cultural richness and emotional tone when translating regional literary masterpieces into global English.",
      flair: "DISCUSSION",
    },
  ],
};

async function seedAll() {
  console.log('--- Seeding Sample Posts for All 7 Communities ---');
  const userRes = await pool.query(`SELECT id FROM "user" ORDER BY "createdAt" ASC LIMIT 1`);
  const userId = userRes.rows[0]?.id;
  if (!userId) {
    console.error('No user found to set as post author');
    await pool.end();
    return;
  }

  const commRes = await pool.query(`SELECT id, slug, name FROM "community"`);
  for (const comm of commRes.rows) {
    const posts = samplePosts[comm.slug] || [
      {
        title: `Welcome to r/${comm.slug}`,
        body: `Share your antigravity thoughts, ideas, and creative writings in the ${comm.name} community.`,
        flair: 'DISCUSSION',
      },
    ];

    for (const post of posts) {
      const inserted = await pool.query(
        `INSERT INTO community_post (id, "communityId", "authorId", title, body, flair, upvotes, "commentCount", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::"PostFlair", 8, 2, now(), now())
         RETURNING id`,
        [comm.id, userId, post.title, post.body, post.flair]
      );

      // Add a root comment
      if (inserted.rows[0]?.id) {
        await pool.query(
          `INSERT INTO community_comment (id, "postId", "authorId", body, depth, upvotes, "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, 'Great post! Looking forward to more discussions in this community.', 0, 3, now(), now())`,
          [inserted.rows[0].id, userId]
        );
      }
    }

    // Update community counters
    const countRes = await pool.query(
      `SELECT COUNT(*) as count FROM community_post WHERE "communityId" = $1`,
      [comm.id]
    );
    await pool.query(
      `UPDATE community SET "postCount" = $1, "updatedAt" = now() WHERE id = $2`,
      [parseInt(countRes.rows[0].count, 10), comm.id]
    );

    console.log(`✅ Seeded ${comm.name} (${comm.slug})`);
  }

  await pool.end();
}

seedAll();
