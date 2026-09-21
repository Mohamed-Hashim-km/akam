import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UpdateProgressDto } from './dto/update-progress.dto.js';

export interface LibraryStoryItem {
  id: string;
  storyId: string;
  title: string;
  slug: string;
  coverImageUrl: string | null;
  category: string | null;
  submissionType?: string;
  mediaUrl?: string | null;
  authorName: string | null;
  authorEmail: string;
  authorAvatarUrl: string | null;
  progressPercent?: number;
  lastScrollPosition?: number;
  isCompleted?: boolean;
  lastReadAt?: string;
  savedAt?: string;
  likedAt?: string;
}

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async updateProgress(userId: string, targetStoryId: string, dto: UpdateProgressDto) {
    const story = await this.prisma.queryOne<{ id: string; authorId: string }>(
      `SELECT id, "authorId" FROM story WHERE id = $1 OR slug = $1 LIMIT 1`,
      [targetStoryId],
    );
    if (!story) throw new NotFoundException('Story not found');

    const userRow = await this.prisma.queryOne<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [userId],
    );
    const roleUpper = (userRow?.role || '').toUpperCase();
    const isStaff = ['ADMIN', 'EDITOR', 'EDITORIAL', 'CHIEF_EDITOR', 'STAFF_EDITOR'].includes(roleUpper);
    const isAuthor = story.authorId === userId;

    let isSubscribed = false;
    try {
      const subRow = await this.prisma.queryOne<{ active: boolean }>(
        `SELECT (status = 'ACTIVE' AND "endDate" > now()) AS active
         FROM subscription WHERE "userId" = $1`,
        [userId],
      );
      isSubscribed = subRow?.active === true;
    } catch {
      // Ignore query error and treat as unsubscribed
    }

    const hasFullAccess = isAuthor || isStaff || isSubscribed;
    const storyId = story.id;
    let finalProgress = Math.max(0, Math.min(100, dto.progressPercent || 0));
    let isCompleted = false;

    if (hasFullAccess) {
      isCompleted = dto.isCompleted ?? finalProgress >= 90;
    } else {
      // Non-subscriber: Preview reading cannot be completed, cap at maximum 20%
      finalProgress = Math.min(finalProgress, 20);
      isCompleted = false;
    }

    const scrollPos = dto.lastScrollPosition ?? 0;

    await this.prisma.execute(
      `INSERT INTO reading_progress (id, "userId", "storyId", "progressPercent", "lastScrollPosition", "isCompleted", "lastReadAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, now())
       ON CONFLICT ("userId", "storyId")
       DO UPDATE SET
         "progressPercent" = CASE 
           WHEN $6 = true THEN EXCLUDED."progressPercent"
           ELSE LEAST(EXCLUDED."progressPercent", 20)
         END,
         "lastScrollPosition" = EXCLUDED."lastScrollPosition",
         "isCompleted" = CASE 
           WHEN $6 = true THEN (EXCLUDED."isCompleted" OR reading_progress."isCompleted")
           ELSE false
         END,
         "lastReadAt" = now()`,
      [userId, storyId, finalProgress, scrollPos, isCompleted, hasFullAccess],
    );

    return this.prisma.queryOne(
      `SELECT * FROM reading_progress WHERE "userId" = $1 AND "storyId" = $2`,
      [userId, storyId],
    );
  }

  async getUserLibrary(userId: string) {
    // 1. Reading History (In Progress & Completed)
    const history = await this.prisma.query<LibraryStoryItem>(
      `SELECT
         rp.id, rp."storyId", s.title, s.slug, s."coverImageUrl", s.category,
         s."submissionType", s."mediaUrl",
         rp."progressPercent", rp."lastScrollPosition", rp."isCompleted", rp."lastReadAt",
         u.name AS "authorName", u.email AS "authorEmail", u."avatarUrl" AS "authorAvatarUrl"
       FROM reading_progress rp
       JOIN story s ON s.id = rp."storyId"
       JOIN "user" u ON u.id = s."authorId"
       WHERE rp."userId" = $1
       ORDER BY rp."lastReadAt" DESC`,
      [userId],
    );

    // 2. Bookmarked stories
    const bookmarked = await this.prisma.query<LibraryStoryItem>(
      `SELECT
         b.id, b."storyId", s.title, s.slug, s."coverImageUrl", s.category,
         s."submissionType", s."mediaUrl",
         b."createdAt" AS "savedAt",
         u.name AS "authorName", u.email AS "authorEmail", u."avatarUrl" AS "authorAvatarUrl"
       FROM story_bookmark b
       JOIN story s ON s.id = b."storyId"
       JOIN "user" u ON u.id = s."authorId"
       WHERE b."userId" = $1
       ORDER BY b."createdAt" DESC`,
      [userId],
    );

    // 3. Liked stories
    const liked = await this.prisma.query<LibraryStoryItem>(
      `SELECT
         l.id, l."storyId", s.title, s.slug, s."coverImageUrl", s.category,
         s."submissionType", s."mediaUrl",
         l."createdAt" AS "likedAt",
         u.name AS "authorName", u.email AS "authorEmail", u."avatarUrl" AS "authorAvatarUrl"
       FROM story_like l
       JOIN story s ON s.id = l."storyId"
       JOIN "user" u ON u.id = s."authorId"
       WHERE l."userId" = $1
       ORDER BY l."createdAt" DESC`,
      [userId],
    );

    const inProgress = history.filter((h) => !h.isCompleted && (h.progressPercent || 0) < 95);
    const completed = history.filter((h) => h.isCompleted || (h.progressPercent || 0) >= 95);

    return {
      inProgress,
      bookmarked,
      liked,
      completed,
      history,
    };
  }

  async getUserLibraryPaginated(
    userId: string,
    tab: string = 'inProgress',
    page: number = 1,
    limit: number = 9,
  ) {
    const validTab = ['inProgress', 'bookmarked', 'liked', 'completed'].includes(tab)
      ? tab
      : 'inProgress';

    const offset = (page - 1) * limit;

    // 1. Get counts for all tabs concurrently
    const [inProgressCountRow, bookmarkedCountRow, likedCountRow, completedCountRow] = await Promise.all([
      this.prisma.queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM reading_progress rp
         JOIN story s ON s.id = rp."storyId"
         WHERE rp."userId" = $1 AND (rp."isCompleted" = false AND COALESCE(rp."progressPercent", 0) < 95)`,
        [userId],
      ),
      this.prisma.queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM story_bookmark b
         JOIN story s ON s.id = b."storyId"
         WHERE b."userId" = $1`,
        [userId],
      ),
      this.prisma.queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM story_like l
         JOIN story s ON s.id = l."storyId"
         WHERE l."userId" = $1`,
        [userId],
      ),
      this.prisma.queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count
         FROM reading_progress rp
         JOIN story s ON s.id = rp."storyId"
         WHERE rp."userId" = $1 AND (rp."isCompleted" = true OR COALESCE(rp."progressPercent", 0) >= 95)`,
        [userId],
      ),
    ]);

    const counts = {
      inProgress: parseInt(inProgressCountRow?.count || '0', 10),
      bookmarked: parseInt(bookmarkedCountRow?.count || '0', 10),
      liked: parseInt(likedCountRow?.count || '0', 10),
      completed: parseInt(completedCountRow?.count || '0', 10),
    };

    // 2. Fetch paginated items for the requested tab
    let items: LibraryStoryItem[] = [];

    if (validTab === 'bookmarked') {
      items = await this.prisma.query<LibraryStoryItem>(
        `SELECT
           b.id, b."storyId", s.title, s.slug, s."coverImageUrl", s.category,
           s."submissionType", s."mediaUrl",
           b."createdAt" AS "savedAt",
           u.name AS "authorName", u.email AS "authorEmail", u."avatarUrl" AS "authorAvatarUrl"
         FROM story_bookmark b
         JOIN story s ON s.id = b."storyId"
         JOIN "user" u ON u.id = s."authorId"
         WHERE b."userId" = $1
         ORDER BY b."createdAt" DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );
    } else if (validTab === 'liked') {
      items = await this.prisma.query<LibraryStoryItem>(
        `SELECT
           l.id, l."storyId", s.title, s.slug, s."coverImageUrl", s.category,
           s."submissionType", s."mediaUrl",
           l."createdAt" AS "likedAt",
           u.name AS "authorName", u.email AS "authorEmail", u."avatarUrl" AS "authorAvatarUrl"
         FROM story_like l
         JOIN story s ON s.id = l."storyId"
         JOIN "user" u ON u.id = s."authorId"
         WHERE l."userId" = $1
         ORDER BY l."createdAt" DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );
    } else if (validTab === 'completed') {
      items = await this.prisma.query<LibraryStoryItem>(
        `SELECT
           rp.id, rp."storyId", s.title, s.slug, s."coverImageUrl", s.category,
           s."submissionType", s."mediaUrl",
           rp."progressPercent", rp."lastScrollPosition", rp."isCompleted", rp."lastReadAt",
           u.name AS "authorName", u.email AS "authorEmail", u."avatarUrl" AS "authorAvatarUrl"
         FROM reading_progress rp
         JOIN story s ON s.id = rp."storyId"
         JOIN "user" u ON u.id = s."authorId"
         WHERE rp."userId" = $1 AND (rp."isCompleted" = true OR COALESCE(rp."progressPercent", 0) >= 95)
         ORDER BY rp."lastReadAt" DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );
    } else {
      // inProgress
      items = await this.prisma.query<LibraryStoryItem>(
        `SELECT
           rp.id, rp."storyId", s.title, s.slug, s."coverImageUrl", s.category,
           s."submissionType", s."mediaUrl",
           rp."progressPercent", rp."lastScrollPosition", rp."isCompleted", rp."lastReadAt",
           u.name AS "authorName", u.email AS "authorEmail", u."avatarUrl" AS "authorAvatarUrl"
         FROM reading_progress rp
         JOIN story s ON s.id = rp."storyId"
         JOIN "user" u ON u.id = s."authorId"
         WHERE rp."userId" = $1 AND (rp."isCompleted" = false AND COALESCE(rp."progressPercent", 0) < 95)
         ORDER BY rp."lastReadAt" DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      );
    }

    const total = counts[validTab as keyof typeof counts] || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items,
      counts,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasMore: page < totalPages,
      },
    };
  }
}
