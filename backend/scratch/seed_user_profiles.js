import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL,
});

const USER_PROFILES = [
  {
    email: 'sachidanandan@akamdigital.com',
    name: 'K. Sachidanandan',
    bio: 'Renowned Indian poet, critic, and bilingual essayist.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 8,
  },
  {
    email: 'nsmadhavan@akamdigital.com',
    name: 'N. S. Madhavan',
    bio: 'Distinguished Malayalam fiction writer and essayist.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 0,
  },
  {
    email: 'sarah@akamdigital.com',
    name: 'Sarah Joseph',
    bio: 'Pioneering Malayalam novelist and feminist writer.',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 4,
  },
  {
    email: 'subhash@akamdigital.com',
    name: 'Subhash Chandran',
    bio: 'Malayalam author, journalist, and Kendra Sahitya Akademi awardee.',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 1,
  },
  {
    email: 'santhosh@akamdigital.com',
    name: 'Santhosh Echikkanam',
    bio: 'Contemporary Malayalam short story writer and screenwriter.',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 2,
  },
  {
    email: 'krmeera@akamdigital.com',
    name: 'K. R. Meera',
    bio: 'Acclaimed Malayalam author and journalist, Sahitya Akademi winner.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 5,
  },
  {
    email: 'benyamin@akamdigital.com',
    name: 'Benyamin',
    bio: 'Malayalam novelist and short story writer, author of Goat Days.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 3,
  },
  {
    email: 'mt@akamdigital.com',
    name: 'M. T. Vasudevan Nair',
    bio: 'Renowned Malayalam novelist and screenwriter, Jnanpith laureate.',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 6,
  },
  {
    email: 'ameenpn8136@gmail.com',
    name: 'Ameen P. N.',
    bio: 'Digital media enthusiast, essayist and contributing author for Akam Editorial.',
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 7,
  },
  {
    email: 'kanishma.ray@megamind.studio',
    name: 'Kanishma Ray',
    bio: 'Senior Editor at Akam Digital, overseeing literary publications and cultural criticism.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    role: 'EDITOR',
    isFeatured: false,
    sortOrder: 0,
  },
  {
    email: 'arundhati@akamdigital.com',
    name: 'Arundhati Roy',
    bio: 'Man Booker Prize-winning author, political activist, and essayist.',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 9,
  },
  {
    email: 'anitanair@akamdigital.com',
    name: 'Anita Nair',
    bio: 'Bestselling novelist, playwright, and literary author.',
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 10,
  },
  {
    email: 'manupillai@akamdigital.com',
    name: 'Manu S. Pillai',
    bio: 'Historian, researcher, and Sahitya Akademi Yuva Puraskar winning author.',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 11,
  },
  {
    email: 'zacharia@akamdigital.com',
    name: 'Paul Zacharia',
    bio: 'Renowned Malayalam short-story writer and outspoken political essayist.',
    avatarUrl: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 12,
  },
  {
    email: 'indumenon@akamdigital.com',
    name: 'Indu Menon',
    bio: 'Contemporary Malayalam author, anthropologist, and short story writer.',
    avatarUrl: 'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&w=400&q=80',
    role: 'AUTHOR',
    isFeatured: true,
    sortOrder: 13,
  },
];

async function seedUserProfiles() {
  console.log('🚀 Seeding user profiles (without losing existing user data)...');

  try {
    for (const u of USER_PROFILES) {
      const existingRes = await pool.query('SELECT id, "avatarUrl", name, bio FROM "user" WHERE email = $1', [u.email]);
      if (existingRes.rows.length > 0) {
        const existing = existingRes.rows[0];
        const avatarToSet = (existing.avatarUrl && existing.avatarUrl.includes('/uploads/'))
          ? existing.avatarUrl
          : u.avatarUrl;

        await pool.query(
          `UPDATE "user"
           SET name = COALESCE(name, $1),
               bio = COALESCE(bio, $2),
               "avatarUrl" = $3,
               role = COALESCE(role, $4::"Role"),
               "isFeatured" = COALESCE("isFeatured", $5),
               "sortOrder" = CASE WHEN "sortOrder" = 0 THEN $6 ELSE "sortOrder" END,
               "updatedAt" = NOW()
           WHERE email = $7`,
          [u.name, u.bio, avatarToSet, u.role, u.isFeatured, u.sortOrder, u.email]
        );
        console.log(`Updated existing user: ${u.name} (${u.email})`);
      } else {
        await pool.query(
          `INSERT INTO "user" (id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::"Role", $6, $7, NOW(), NOW())`,
          [u.email, u.name, u.bio, u.avatarUrl, u.role, u.isFeatured, u.sortOrder]
        );
        console.log(`Inserted new dummy user: ${u.name} (${u.email})`);
      }
    }
    console.log('✅ User profiles seeded successfully!');
  } catch (err) {
    console.error('❌ Error seeding user profiles:', err);
  } finally {
    await pool.end();
  }
}

seedUserProfiles();
