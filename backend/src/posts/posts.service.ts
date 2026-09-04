import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';

export type SortMode = 'hot' | 'new' | 'top';

export interface PostRow {
  id: string;
  communityId: string;
  communitySlug: string;
  communityName: string;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  title: string;
  body: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  flair: string;
  status: string;
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  isPinned: boolean;
  isLocked: boolean;
  createdAt: string;
  updatedAt: string;
  // viewer-specific (set after query)
  myVote?: 'UP' | 'DOWN' | null;
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Feed Query ──────────────────────────────────────────────────────
  async findByCommunity(
    communitySlug: string,
    sort: SortMode = 'hot',
    page = 1,
    limit = 20,
    userId?: string,
  ): Promise<{ data: PostRow[]; meta: object }> {
    const community = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community WHERE slug = $1 AND "isActive" = true`,
      [communitySlug],
    );
    if (!community) throw new NotFoundException(`Community '${communitySlug}' not found`);

    const offset = (Math.max(1, page) - 1) * Math.max(1, limit);

    // Hot score: log10(|score|) - time_decay (half-life ~12 hours = 43200 seconds)
    const orderByClause: Record<SortMode, string> = {
      hot: `
        p."isPinned" DESC,
        (
          LOG(GREATEST(ABS(p.upvotes - p.downvotes), 1)) *
          SIGN(CAST(p.upvotes - p.downvotes AS FLOAT)) -
          (EXTRACT(EPOCH FROM (now() - p."createdAt")) / 43200.0)
        ) DESC,
        p."createdAt" DESC`,
      new: `p."isPinned" DESC, p."createdAt" DESC`,
      top: `p."isPinned" DESC, (p.upvotes - p.downvotes) DESC, p."createdAt" DESC`,
    };

    const [data, countRow] = await Promise.all([
      this.prisma.query<PostRow>(`
        SELECT
          p.id, p."communityId", c.slug AS "communitySlug", c.name AS "communityName",
          p."authorId",
          u.name AS "authorName",
          u."avatarUrl" AS "authorAvatarUrl",
          p.title, p.body, p."imageUrl", p."linkUrl",
          p.flair, p.status,
          p.upvotes, p.downvotes, (p.upvotes - p.downvotes) AS score,
          COALESCE((SELECT COUNT(*)::int FROM community_comment cc WHERE cc."postId" = p.id AND cc."isRemoved" = false), 0) AS "commentCount",
          p."isPinned", p."isLocked",
          p."createdAt", p."updatedAt"
        FROM community_post p
        JOIN "user" u ON u.id = p."authorId"
        JOIN community c ON c.id = p."communityId"
        WHERE p."communityId" = $1
          AND p.status != 'REMOVED'
        ORDER BY ${orderByClause[sort]}
        LIMIT $2 OFFSET $3
      `, [community.id, limit, offset]),
      this.prisma.queryOne<{ count: string }>(`
        SELECT COUNT(*) AS count FROM community_post
        WHERE "communityId" = $1 AND status != 'REMOVED'
      `, [community.id]),
    ]);

    // Attach viewer's own vote if logged in
    if (userId && data.length > 0) {
      const postIds = data.map((p) => p.id);
      const votes = await this.prisma.query<{ postId: string; value: string }>(
        `SELECT "postId", value FROM post_vote
         WHERE "userId" = $1 AND "postId" = ANY($2::text[])`,
        [userId, postIds],
      );
      const voteMap = new Map(votes.map((v) => [v.postId, v.value]));
      for (const post of data) {
        post.myVote = (voteMap.get(post.id) as 'UP' | 'DOWN') ?? null;
      }
    }

    const total = parseInt(countRow?.count ?? '0', 10);
    return {
      data,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit) || 1,
        sort,
      },
    };
  }

  // ─── Single Post ─────────────────────────────────────────────────────
  async findOne(postId: string, userId?: string): Promise<PostRow> {
    const post = await this.prisma.queryOne<PostRow>(`
      SELECT
        p.id, p."communityId", c.slug AS "communitySlug", c.name AS "communityName",
        p."authorId",
        u.name AS "authorName",
        u."avatarUrl" AS "authorAvatarUrl",
        p.title, p.body, p."imageUrl", p."linkUrl",
        p.flair, p.status,
        p.upvotes, p.downvotes, (p.upvotes - p.downvotes) AS score,
        COALESCE((SELECT COUNT(*)::int FROM community_comment cc WHERE cc."postId" = p.id AND cc."isRemoved" = false), 0) AS "commentCount",
        p."isPinned", p."isLocked",
        p."lockedAt", p."lockedById",
        p."createdAt", p."updatedAt"
      FROM community_post p
      JOIN "user" u ON u.id = p."authorId"
      JOIN community c ON c.id = p."communityId"
      WHERE p.id = $1 AND p.status != 'REMOVED'
    `, [postId]);

    if (!post) throw new NotFoundException('Post not found');

    if (userId) {
      const vote = await this.prisma.queryOne<{ value: string }>(
        `SELECT value FROM post_vote WHERE "userId" = $1 AND "postId" = $2`,
        [userId, postId],
      );
      post.myVote = (vote?.value as 'UP' | 'DOWN') ?? null;
    }

    return post;
  }

  // ─── Create Post ─────────────────────────────────────────────────────
  async create(
    authorId: string,
    communitySlug: string,
    dto: CreatePostDto,
  ): Promise<PostRow> {
    const community = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community WHERE slug = $1 AND "isActive" = true`,
      [communitySlug],
    );
    if (!community) throw new NotFoundException(`Community '${communitySlug}' not found`);

    // User must be a member to post
    const membership = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_membership WHERE "userId" = $1 AND "communityId" = $2`,
      [authorId, community.id],
    );
    if (!membership) {
      throw new ForbiddenException('You must join this community before posting');
    }

    const [post] = await Promise.all([
      this.prisma.queryOne<{ id: string }>(
        `INSERT INTO community_post
           (id, "communityId", "authorId", title, body, "imageUrl", "linkUrl", flair, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7::\"PostFlair\", now(), now())
         RETURNING id`,
        [
          community.id,
          authorId,
          dto.title,
          dto.body ?? null,
          dto.imageUrl ?? null,
          dto.linkUrl ?? null,
          dto.flair ?? 'DISCUSSION',
        ],
      ),
      this.prisma.execute(
        `UPDATE community SET "postCount" = "postCount" + 1, "updatedAt" = now() WHERE id = $1`,
        [community.id],
      ),
    ]);

    return this.findOne(post!.id);
  }

  // ─── Delete Post ─────────────────────────────────────────────────────
  async delete(
    postId: string,
    userId: string,
    userRole: string,
  ): Promise<{ success: boolean }> {
    const post = await this.prisma.queryOne<{ id: string; authorId: string; communityId: string }>(
      `SELECT id, "authorId", "communityId" FROM community_post WHERE id = $1`,
      [postId],
    );
    if (!post) throw new NotFoundException('Post not found');

    if (post.authorId !== userId && !['EDITOR', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Not authorized to delete this post');
    }

    await Promise.all([
      this.prisma.execute(`DELETE FROM community_post WHERE id = $1`, [postId]),
      this.prisma.execute(
        `UPDATE community SET "postCount" = GREATEST("postCount" - 1, 0), "updatedAt" = now() WHERE id = $1`,
        [post.communityId],
      ),
    ]);

    return { success: true };
  }

  // ─── Report Post ─────────────────────────────────────────────────────
  async reportPost(
    reporterId: string,
    postId: string,
    reason: string,
    details?: string,
  ) {
    const post = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_post WHERE id = $1`,
      [postId],
    );
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.queryOne(
      `INSERT INTO community_report (id, "postId", "reporterId", reason, details, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'PENDING', now(), now())
       RETURNING id, "postId", "reporterId", reason, status, "createdAt"`,
      [postId, reporterId, reason, details ?? null],
    );
  }
}
