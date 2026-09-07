import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

interface CommunitySeed {
  slug: string;
  name: string;
  description: string;
  color: string;
  posts: {
    title: string;
    body: string;
    flair: 'DISCUSSION' | 'QUESTION' | 'ANNOUNCEMENT' | 'RESOURCE' | 'FEEDBACK';
    upvotes: number;
    downvotes: number;
    comments?: {
      body: string;
      upvotes: number;
      replies?: { body: string; upvotes: number }[];
    }[];
  }[];
}

const standardCommunities: CommunitySeed[] = [
  {
    slug: 'childrens-literature',
    name: "Children's Literature",
    description: "Fostering imagination, folklore, fairy tales, and illustrated stories for young readers and children's book enthusiasts.",
    color: '#EC4899',
    posts: [
      {
        title: "The Magic Palm Leaf: A Children's Tale of Wonder",
        body: "Illustrated story about young Appu discovering a magical palm leaf manuscript in his grandmother's attic that brings ancient Malayalam fables to life. What are your favorite childhood folklore tales that inspired your imagination?",
        flair: "DISCUSSION",
        upvotes: 14,
        downvotes: 1,
        comments: [
          {
            body: "This is a heartwarming story concept! The illustration preview looks amazing. My children would love to read this.",
            upvotes: 5,
            replies: [
              {
                body: "Thank you so much! We are releasing the full illustrated digital edition next month on Akam Masika.",
                upvotes: 3,
              },
            ],
          },
          {
            body: "Grandmother's attic tales always have the best nostalgia. Reminds me of reading Kathasaritsagara as a kid.",
            upvotes: 4,
          },
        ],
      },
      {
        title: "Recommended Malayalam Children's Books for Young Readers (Ages 7-12)",
        body: "Here is a curated list of classic and modern Malayalam children's literature that spark curiosity and moral learning:\n1. Unnikuttante Lokam by N.P. Mohammed\n2. Aithihyamala (Children's Edition) by Kottarathil Sankunni\n3. Magic Cow & Other Tales by Kamala Das\n4. Kuttikatha Mala (Illustrated Series)\n\nWhat books would you add to this list?",
        flair: "RESOURCE",
        upvotes: 22,
        downvotes: 0,
        comments: [
          {
            body: "Aithihyamala is an absolute classic! Every child should read the legend of Kayamkulam Kochunni and Pakkanar.",
            upvotes: 8,
          },
          {
            body: "Great recommendations. I would also add 'Mittumutthan' and 'Odayil Ninnu' (for slightly older kids).",
            upvotes: 6,
          },
        ],
      },
      {
        title: "How do you write engaging dialogue for young children in modern stories?",
        body: "I am currently working on an illustrated storybook for 6-8 year olds. I find it challenging to keep the tone playful yet natural without sounding overly simplistic. Any tips from fellow children's story writers on pacing and sentence structure?",
        flair: "QUESTION",
        upvotes: 9,
        downvotes: 0,
        comments: [
          {
            body: "Read the dialogue out loud! Children listen with rhythm. Use short active sentences and playful sound words (onomatopoeia).",
            upvotes: 7,
          },
        ],
      },
    ],
  },
  {
    slug: 'malayalam-literature',
    name: 'Malayalam Literature',
    description: 'Deep-dive literary discussions on classic and contemporary Malayalam fiction, poetry, essays, and heritage.',
    color: '#0284C7',
    posts: [
      {
        title: "Deep Literary Analysis of Thakazhi's Chemmeen & Social Realism",
        body: "Exploring the mythic themes, coastal subculture, romantic tragedy, and moral symbolism in Thakazhi Sivasankara Pillai's masterpiece Chemmeen. How does the sea function as both a provider and a moral judge in the narrative?",
        flair: "DISCUSSION",
        upvotes: 31,
        downvotes: 2,
        comments: [
          {
            body: "Incredible analysis. Thakazhi's depiction of Pareekutty and Karuthamma remains one of the most haunting love stories in modern literature.",
            upvotes: 12,
          },
        ],
      },
      {
        title: "The Evolving Narrative Style of Basheer: Simplicity as Pure Genius",
        body: "Vaikom Muhammad Basheer transformed Malayalam literature by writing in colloquial everyday spoken Malayalam rather than ornate academic prose. Discussion on how Balyakalasakhi and Mathilukal changed Malayalam storytelling forever.",
        flair: "DISCUSSION",
        upvotes: 45,
        downvotes: 1,
        comments: [
          {
            body: "Basheer's humor hides profound existential philosophy. Balyakalasakhi breaks your heart with the simplest of words.",
            upvotes: 15,
          },
        ],
      },
    ],
  },
  {
    slug: 'fiction-serialized-novels',
    name: 'Fiction & Serialized Novels',
    description: 'Weekly chapter releases, plot architecture, character arcs, and serialized novel creation.',
    color: '#8B5CF6',
    posts: [
      {
        title: 'The Quantum Quill: Episode 1 — The Lost Scribe',
        body: 'Chapter 1 of my serialized mystery novel. Set in historic Fort Kochi, a young antiquarian discovers a sealed 18th-century journal that predicts modern events word for word.',
        flair: 'ANNOUNCEMENT',
        upvotes: 18,
        downvotes: 1,
        comments: [
          {
            body: 'Fascinating opening hook! Subscribed for next week\'s chapter.',
            upvotes: 4,
          },
        ],
      },
      {
        title: 'Structuring Cliffhangers vs Episodic Resolution in Weekly Serial Fiction',
        body: 'Looking for advice from authors on balancing weekly cliffhangers with meaningful chapter progression. How do you keep readers hooked without feeling formulaic?',
        flair: 'QUESTION',
        upvotes: 12,
        downvotes: 0,
      },
    ],
  },
  {
    slug: 'poetry-masika',
    name: 'Poetry & Masika',
    description: 'Poetic verses, rhythm, contemporary stanza forms, and submissions for the Masika Digital magazine.',
    color: '#10B981',
    posts: [
      {
        title: 'Echoes of the Monsoon: Contemporary Free Verse Collection',
        body: "A short collection of three poems inspired by western ghat rains and quiet evenings. Submitted for this month's Masika digital edition. Feedback and critiques welcome!",
        flair: 'DISCUSSION',
        upvotes: 27,
        downvotes: 0,
        comments: [
          {
            body: 'The imagery in stanza 2 is breathtaking. Beautiful rhythm!',
            upvotes: 6,
          },
        ],
      },
      {
        title: 'Metrical Rhythms in Modern Malayalam Poetry: Kavitakutuma',
        body: 'Exploring the transition from classic Dravidian meters (Vrittam) to modern organic free verse in contemporary Malayalam poetry.',
        flair: 'RESOURCE',
        upvotes: 19,
        downvotes: 1,
      },
    ],
  },
  {
    slug: 'translations',
    name: 'Translations',
    description: 'Bridging Malayalam literary masterpieces with global languages through faithful and expressive translation.',
    color: '#F59E0B',
    posts: [
      {
        title: 'Translating Nuance: Bridging Malayalam Idioms into English',
        body: 'A discussion on preserving cultural richness, emotional resonance, and local dialectal tone when translating regional masterpieces into global English prose.',
        flair: 'DISCUSSION',
        upvotes: 16,
        downvotes: 0,
        comments: [
          {
            body: 'Translating regional proverbs is the hardest part. You have to capture the intent rather than literal word-for-word translation.',
            upvotes: 8,
          },
        ],
      },
    ],
  },
  {
    slug: 'tech-digital-culture',
    name: 'Tech & Digital Culture',
    description: 'The intersection of AI, digital publishing, interactive storytelling, and modern media.',
    color: '#059669',
    posts: [
      {
        title: 'The Future of Digital Publishing & Reader Engagement',
        body: 'How digital flipbooks, interactive commentary, audio narration, and online communities are reshaping how authors publish and interact with readers globally.',
        flair: 'RESOURCE',
        upvotes: 24,
        downvotes: 1,
      },
    ],
  },
  {
    slug: 'novella',
    name: 'Novella',
    description: 'Crafting high-impact medium-length stories (20,000 to 40,000 words) for modern digital readers.',
    color: '#E11D48',
    posts: [
      {
        title: 'Why the Novella Format is Experiencing a Digital Revival',
        body: 'Discussion on how 20k-40k word novellas hit the sweet spot for modern digital readers seeking rich character development without committing to 500-page epics.',
        flair: 'FEEDBACK',
        upvotes: 15,
        downvotes: 0,
      },
    ],
  },
];

async function reseedCommunities() {
  console.log('🚀 Starting Clean Reseed of All Communities Data...');

  try {
    // 1. Get an existing user ID for authoring
    const userRes = await pool.query(`SELECT id FROM "user" ORDER BY "createdAt" ASC LIMIT 1`);
    let userId = userRes.rows[0]?.id;

    if (!userId) {
      const newUser = await pool.query(
        `INSERT INTO "user" (id, email, name, role, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, 'editorial@akam.digital', 'Akam Editorial', 'ADMIN', now(), now())
         RETURNING id`
      );
      userId = newUser.rows[0].id;
    }

    // 2. Wipe existing community data completely
    console.log('🧹 Clearing test community posts, comments, votes, reports, and memberships...');
    await pool.query(`DELETE FROM comment_vote`);
    await pool.query(`DELETE FROM post_vote`);
    await pool.query(`DELETE FROM community_report`);
    await pool.query(`DELETE FROM community_comment`);
    await pool.query(`DELETE FROM community_post`);
    await pool.query(`DELETE FROM community_membership`);
    await pool.query(`DELETE FROM community`);

    // 3. Insert Standard Communities and Posts
    for (const commData of standardCommunities) {
      const commInsert = await pool.query(
        `INSERT INTO community (id, slug, name, description, color, "isActive", "memberCount", "postCount", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, 1, 0, now(), now())
         RETURNING id`,
        [commData.slug, commData.name, commData.description, commData.color]
      );
      const communityId = commInsert.rows[0].id;

      // Join author to community
      await pool.query(
        `INSERT INTO community_membership (id, "userId", "communityId", role, "joinedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'MODERATOR', now())`,
        [userId, communityId]
      );

      let postCount = 0;

      for (const postData of commData.posts) {
        postCount++;
        const commentCount = postData.comments
          ? postData.comments.reduce((acc, c) => acc + 1 + (c.replies ? c.replies.length : 0), 0)
          : 0;

        const postInsert = await pool.query(
          `INSERT INTO community_post (id, "communityId", "authorId", title, body, flair, status, upvotes, downvotes, "commentCount", "isPinned", "isLocked", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::"PostFlair", 'ACTIVE', $6, $7, $8, false, false, now(), now())
           RETURNING id`,
          [
            communityId,
            userId,
            postData.title,
            postData.body,
            postData.flair,
            postData.upvotes,
            postData.downvotes,
            commentCount,
          ]
        );
        const postId = postInsert.rows[0].id;

        // Insert Comments
        if (postData.comments && postData.comments.length > 0) {
          for (const commentData of postData.comments) {
            const commentInsert = await pool.query(
              `INSERT INTO community_comment (id, "postId", "authorId", body, depth, upvotes, downvotes, "isRemoved", "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, $2, $3, 0, $4, 0, false, now(), now())
               RETURNING id`,
              [postId, userId, commentData.body, commentData.upvotes]
            );
            const parentCommentId = commentInsert.rows[0].id;

            if (commentData.replies && commentData.replies.length > 0) {
              for (const replyData of commentData.replies) {
                await pool.query(
                  `INSERT INTO community_comment (id, "postId", "authorId", "parentId", body, depth, upvotes, downvotes, "isRemoved", "createdAt", "updatedAt")
                   VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 1, $5, 0, false, now(), now())`,
                  [postId, userId, parentCommentId, replyData.body, replyData.upvotes]
                );
              }
            }
          }
        }
      }

      // Update community postCount & memberCount
      await pool.query(
        `UPDATE community SET "postCount" = $1, "memberCount" = 1, "updatedAt" = now() WHERE id = $2`,
        [postCount, communityId]
      );

      console.log(`✅ Seeded ${commData.name} (${commData.slug}) with ${postCount} posts.`);
    }

    console.log('🎉 Standard Communities & Posts Reseeded Successfully!');
  } catch (err) {
    console.error('❌ Error reseeding communities:', err);
  } finally {
    await pool.end();
  }
}

reseedCommunities();
