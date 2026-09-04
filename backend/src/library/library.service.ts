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
    const story = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM story WHERE id = $1 OR slug = $1 LIMIT 1`,
      [targetStoryId],
    );
    if (!story) throw new NotFoundException('Story not found');

    const storyId = story.id;
    const isCompleted = dto.isCompleted ?? dto.progressPercent >= 90;
    const scrollPos = dto.lastScrollPosition ?? 0;

    await this.prisma.execute(
      `INSERT INTO reading_progress (id, "userId", "storyId", "progressPercent", "lastScrollPosition", "isCompleted", "lastReadAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, now())
       ON CONFLICT ("userId", "storyId")
       DO UPDATE SET
         "progressPercent" = EXCLUDED."progressPercent",
         "lastScrollPosition" = EXCLUDED."lastScrollPosition",
         "isCompleted" = EXCLUDED."isCompleted" OR reading_progress."isCompleted",
         "lastReadAt" = now()`,
      [userId, storyId, dto.progressPercent, scrollPos, isCompleted],
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
}
