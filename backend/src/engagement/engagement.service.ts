import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

export interface CommentRow {
  id: string;
  storyId: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  userAvatarUrl: string | null;
  content: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class EngagementService {
  constructor(private prisma: PrismaService) {}

  private async ensureStoryExists(storyId: string) {
    const story = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM story WHERE id = $1 OR slug = $1 LIMIT 1`,
      [storyId],
    );
    if (!story) throw new NotFoundException('Story not found');
    return story.id;
  }

  async toggleLike(userId: string, targetStoryId: string) {
    const storyId = await this.ensureStoryExists(targetStoryId);

    const existing = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM story_like WHERE "userId" = $1 AND "storyId" = $2`,
      [userId, storyId],
    );

    let liked = false;
    if (existing) {
      await this.prisma.execute(
        `DELETE FROM story_like WHERE "userId" = $1 AND "storyId" = $2`,
        [userId, storyId],
      );
      liked = false;
    } else {
      await this.prisma.execute(
        `INSERT INTO story_like (id, "userId", "storyId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, now())`,
        [userId, storyId],
      );
      liked = true;
    }

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM story_like WHERE "storyId" = $1`,
      [storyId],
    );
    const likeCount = parseInt(countRow?.count ?? '0', 10);

    return { liked, likeCount };
  }

  async toggleBookmark(userId: string, targetStoryId: string) {
    const storyId = await this.ensureStoryExists(targetStoryId);

    const existing = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM story_bookmark WHERE "userId" = $1 AND "storyId" = $2`,
      [userId, storyId],
    );

    let bookmarked = false;
    if (existing) {
      await this.prisma.execute(
        `DELETE FROM story_bookmark WHERE "userId" = $1 AND "storyId" = $2`,
        [userId, storyId],
      );
      bookmarked = false;
    } else {
      await this.prisma.execute(
        `INSERT INTO story_bookmark (id, "userId", "storyId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, now())`,
        [userId, storyId],
      );
      bookmarked = true;
    }

    return { bookmarked };
  }

  async getEngagement(targetStoryId: string, userId?: string) {
    const storyId = await this.ensureStoryExists(targetStoryId);

    const likeCountRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM story_like WHERE "storyId" = $1`,
      [storyId],
    );
    const commentCountRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM story_comment WHERE "storyId" = $1`,
      [storyId],
    );

    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const likedRow = await this.prisma.queryOne<{ id: string }>(
        `SELECT id FROM story_like WHERE "userId" = $1 AND "storyId" = $2`,
        [userId, storyId],
      );
      isLiked = !!likedRow;

      const bookmarkedRow = await this.prisma.queryOne<{ id: string }>(
        `SELECT id FROM story_bookmark WHERE "userId" = $1 AND "storyId" = $2`,
        [userId, storyId],
      );
      isBookmarked = !!bookmarkedRow;
    }

    return {
      likeCount: parseInt(likeCountRow?.count ?? '0', 10),
      commentCount: parseInt(commentCountRow?.count ?? '0', 10),
      isLiked,
      isBookmarked,
    };
  }

  async getRecentComments(limit = 10) {
    const sql = `
      SELECT 
        c.id,
        c.content,
        c."isFeatured",
        c."createdAt",
        c."storyId",
        s.title AS "storyTitle",
        s.slug AS "storySlug",
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        u."avatarUrl" AS "userAvatarUrl"
      FROM story_comment c
      JOIN story s ON s.id = c."storyId"
      JOIN "user" u ON u.id = c."userId"
      WHERE c."isFeatured" = true
      ORDER BY c."createdAt" DESC
      LIMIT $1
    `;
    return this.prisma.query<any>(sql, [limit]);
  }

  async getCommentsEditorial(pageVal = 1, limitVal = 10, search?: string, featured?: string) {
    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 10;
    const offset = (page - 1) * limit;

    const whereConditions: string[] = [];
    const params: any[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereConditions.push(`(c.content ILIKE $${params.length} OR s.title ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.name ILIKE $${params.length})`);
    }

    if (featured === 'true') {
      whereConditions.push(`c."isFeatured" = true`);
    } else if (featured === 'false') {
      whereConditions.push(`c."isFeatured" = false`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `
      SELECT COUNT(*) AS count
      FROM story_comment c
      JOIN story s ON s.id = c."storyId"
      JOIN "user" u ON u.id = c."userId"
      ${whereClause}
    `;
    const countRes = await this.prisma.queryOne<{ count: string }>(countSql, params);
    const total = parseInt(countRes?.count ?? '0', 10);

    const queryParams = [...params, limit, offset];
    const dataSql = `
      SELECT 
        c.id,
        c.content,
        c."isFeatured",
        c."createdAt",
        c."storyId",
        s.title AS "storyTitle",
        s.slug AS "storySlug",
        u.id AS "userId",
        u.name AS "userName",
        u.email AS "userEmail",
        u."avatarUrl" AS "userAvatarUrl"
      FROM story_comment c
      JOIN story s ON s.id = c."storyId"
      JOIN "user" u ON u.id = c."userId"
      ${whereClause}
      ORDER BY c."createdAt" DESC
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;

    const data = await this.prisma.query<any>(dataSql, queryParams);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async toggleFeaturedComment(commentId: string) {
    const existing = await this.prisma.queryOne<{ id: string; isFeatured: boolean }>(
      `SELECT id, "isFeatured" FROM story_comment WHERE id = $1`,
      [commentId],
    );
    if (!existing) throw new NotFoundException('Comment not found');

    const newStatus = !existing.isFeatured;
    await this.prisma.execute(
      `UPDATE story_comment SET "isFeatured" = $1, "updatedAt" = now() WHERE id = $2`,
      [newStatus, commentId],
    );

    return { id: commentId, isFeatured: newStatus };
  }

  async getComments(targetStoryId: string): Promise<CommentRow[]> {
    const storyId = await this.ensureStoryExists(targetStoryId);

    return this.prisma.query<CommentRow>(
      `SELECT
         c.id, c."storyId", c."userId", c.content, c."createdAt", c."updatedAt",
         u.name AS "userName", u.email AS "userEmail", u."avatarUrl" AS "userAvatarUrl"
       FROM story_comment c
       JOIN "user" u ON u.id = c."userId"
       WHERE c."storyId" = $1
       ORDER BY c."createdAt" DESC`,
      [storyId],
    );
  }

  async createComment(userId: string, targetStoryId: string, content: string): Promise<CommentRow> {
    const storyId = await this.ensureStoryExists(targetStoryId);

    const inserted = await this.prisma.queryOne<{ id: string }>(
      `INSERT INTO story_comment (id, "userId", "storyId", content, "isFeatured", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, false, now(), now())
       RETURNING id`,
      [userId, storyId, content],
    );

    const fullComment = await this.prisma.queryOne<CommentRow>(
      `SELECT
         c.id, c."storyId", c."userId", c.content, c."createdAt", c."updatedAt",
         u.name AS "userName", u.email AS "userEmail", u."avatarUrl" AS "userAvatarUrl"
       FROM story_comment c
       JOIN "user" u ON u.id = c."userId"
       WHERE c.id = $1`,
      [inserted!.id],
    );

    return fullComment!;
  }

  async deleteComment(commentId: string, userId: string, userRole: string) {
    const comment = await this.prisma.queryOne<{ id: string; userId: string }>(
      `SELECT id, "userId" FROM story_comment WHERE id = $1`,
      [commentId],
    );
    if (!comment) throw new NotFoundException('Comment not found');

    if (comment.userId !== userId && !['EDITOR', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Not authorized to delete this comment');
    }

    await this.prisma.execute(`DELETE FROM story_comment WHERE id = $1`, [commentId]);
    return { success: true };
  }
}
