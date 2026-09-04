import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto.js';

// ── Types ─────────────────────────────────────────────────────────────────
interface FlatCommentRow {
  id: string;
  parentId: string | null;
  authorId: string;
  authorName: string | null;
  authorAvatarUrl: string | null;
  body: string;
  depth: number;
  upvotes: number;
  downvotes: number;
  isRemoved: boolean;
  createdAt: string;
}

export interface CommentNode extends FlatCommentRow {
  score: number;
  replies: CommentNode[];
  myVote?: 'UP' | 'DOWN' | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// REMOVED body placeholder
const REMOVED_BODY = '[This comment was removed by the editorial team]';

@Injectable()
export class CommunityCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch the full nested comment tree for a post.
   *
   * Strategy: Single Recursive CTE — fetches ALL comments in one DB round-trip.
   * O(n) in-memory tree builder using a Map avoids any N+1 problem.
   */
  async getCommentTree(postId: string, userId?: string): Promise<CommentNode[]> {
    // Validate post exists
    const post = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_post WHERE id = $1`,
      [postId],
    );
    if (!post) throw new NotFoundException('Post not found');

    const rows = await this.prisma.query<FlatCommentRow>(`
      WITH RECURSIVE comment_tree AS (
        -- Anchor: root-level comments (parentId IS NULL)
        SELECT
          c.id,
          c."parentId",
          c."authorId",
          c.body,
          c.depth,
          c.upvotes,
          c.downvotes,
          c."isRemoved",
          c."createdAt",
          u.name AS "authorName",
          u."avatarUrl" AS "authorAvatarUrl"
        FROM community_comment c
        JOIN "user" u ON u.id = c."authorId"
        WHERE c."postId" = $1
          AND c."parentId" IS NULL

        UNION ALL

        -- Recursive: children of nodes already in the CTE
        SELECT
          c.id,
          c."parentId",
          c."authorId",
          c.body,
          c.depth,
          c.upvotes,
          c.downvotes,
          c."isRemoved",
          c."createdAt",
          u.name AS "authorName",
          u."avatarUrl" AS "authorAvatarUrl"
        FROM community_comment c
        JOIN "user" u ON u.id = c."authorId"
        INNER JOIN comment_tree ct ON ct.id = c."parentId"
      )
      SELECT *
      FROM comment_tree
      ORDER BY
        -- Top-level sorted by score descending (Reddit-style)
        CASE WHEN "parentId" IS NULL THEN (upvotes - downvotes) END DESC NULLS LAST,
        -- Replies sorted chronologically within their parent
        "createdAt" ASC
    `, [postId]);

    // Attach viewer votes in one batch query
    let voteMap = new Map<string, 'UP' | 'DOWN'>();
    if (userId && rows.length > 0) {
      const commentIds = rows.map((r) => r.id);
      const votes = await this.prisma.query<{ commentId: string; value: string }>(
        `SELECT "commentId", value FROM comment_vote
         WHERE "userId" = $1 AND "commentId" = ANY($2::text[])`,
        [userId, commentIds],
      );
      voteMap = new Map(votes.map((v) => [v.commentId, v.value as 'UP' | 'DOWN']));
    }

    return this.buildTree(rows, voteMap);
  }

  /**
   * O(n) tree assembly — single pass through a Map.
   * No recursion, no re-iteration — O(n) time and space.
   */
  private buildTree(
    flat: FlatCommentRow[],
    voteMap: Map<string, 'UP' | 'DOWN'>,
  ): CommentNode[] {
    const nodeMap = new Map<string, CommentNode>();
    const roots: CommentNode[] = [];

    // First pass: create all nodes
    for (const row of flat) {
      nodeMap.set(row.id, {
        ...row,
        body: row.isRemoved ? REMOVED_BODY : row.body,
        // Redact author for removed comments
        authorName: row.isRemoved ? null : row.authorName,
        authorAvatarUrl: row.isRemoved ? null : row.authorAvatarUrl,
        score: row.upvotes - row.downvotes,
        replies: [],
        myVote: voteMap.get(row.id) ?? null,
      });
    }

    // Second pass: wire children to parents
    for (const row of flat) {
      const node = nodeMap.get(row.id)!;
      if (row.parentId && nodeMap.has(row.parentId)) {
        nodeMap.get(row.parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  // ─── Create Comment / Reply ──────────────────────────────────────────────
  async createComment(
    userId: string,
    postId: string,
    dto: CreateCommunityCommentDto,
  ) {
    // Post must exist and not be locked
    const post = await this.prisma.queryOne<{ id: string; isLocked: boolean }>(
      `SELECT id, "isLocked" FROM community_post WHERE id = $1 AND status != 'REMOVED'`,
      [postId],
    );
    if (!post) throw new NotFoundException('Post not found');
    if (post.isLocked) {
      throw new ForbiddenException('This thread has been locked by the editorial team');
    }

    // Resolve parent depth
    let depth = 0;
    if (dto.parentId) {
      const parent = await this.prisma.queryOne<{ id: string; depth: number }>(
        `SELECT id, depth FROM community_comment WHERE id = $1 AND "postId" = $2`,
        [dto.parentId, postId],
      );
      if (!parent) throw new NotFoundException('Parent comment not found in this post');
      depth = parent.depth + 1;
    }

    const [inserted] = await Promise.all([
      this.prisma.queryOne<{ id: string }>(
        `INSERT INTO community_comment
           (id, "postId", "authorId", "parentId", body, depth, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, now(), now())
         RETURNING id`,
        [postId, userId, dto.parentId ?? null, dto.body, depth],
      ),
      // Atomically increment comment counter on the post
      this.prisma.execute(
        `UPDATE community_post
         SET "commentCount" = "commentCount" + 1, "updatedAt" = now()
         WHERE id = $1`,
        [postId],
      ),
    ]);

    // Return full comment with author info
    return this.prisma.queryOne(
      `SELECT
         c.id, c."postId", c."parentId", c."authorId", c.body, c.depth,
         c.upvotes, c.downvotes, c."isRemoved", c."createdAt",
         u.name AS "authorName", u."avatarUrl" AS "authorAvatarUrl"
       FROM community_comment c
       JOIN "user" u ON u.id = c."authorId"
       WHERE c.id = $1`,
      [inserted!.id],
    );
  }

  // ─── Delete / Remove Comment ─────────────────────────────────────────────
  async deleteComment(
    commentId: string,
    userId: string,
    userRole: string,
  ): Promise<{ success: boolean; isRemoved?: boolean }> {
    const comment = await this.prisma.queryOne<{ id: string; authorId: string }>(
      `SELECT id, "authorId" FROM community_comment WHERE id = $1`,
      [commentId],
    );
    if (!comment) throw new NotFoundException('Comment not found');

    if (['EDITOR', 'ADMIN'].includes(userRole)) {
      // Editorial soft-delete: preserve thread structure
      await this.prisma.execute(
        `UPDATE community_comment
         SET "isRemoved" = true, "removedById" = $1, "removedAt" = now(), "updatedAt" = now()
         WHERE id = $2`,
        [userId, commentId],
      );
      return { success: true, isRemoved: true };
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Not authorized to delete this comment');
    }

    // Author hard-delete (only if no replies to preserve thread)
    const replyCount = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM community_comment WHERE "parentId" = $1`,
      [commentId],
    );
    const hasReplies = parseInt(replyCount?.count ?? '0', 10) > 0;

    if (hasReplies) {
      // Soft-delete to preserve replies
      await this.prisma.execute(
        `UPDATE community_comment SET "isRemoved" = true, "updatedAt" = now() WHERE id = $1`,
        [commentId],
      );
      return { success: true, isRemoved: true };
    }

    await this.prisma.execute(`DELETE FROM community_comment WHERE id = $1`, [commentId]);
    return { success: true, isRemoved: false };
  }

  // ─── Report Comment ───────────────────────────────────────────────────────
  async reportComment(
    reporterId: string,
    commentId: string,
    reason: string,
    details?: string,
  ) {
    const comment = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_comment WHERE id = $1`,
      [commentId],
    );
    if (!comment) throw new NotFoundException('Comment not found');

    return this.prisma.queryOne(
      `INSERT INTO community_report
         (id, "commentId", "reporterId", reason, details, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'PENDING', now(), now())
       RETURNING id, "commentId", "reporterId", reason, status, "createdAt"`,
      [commentId, reporterId, reason, details ?? null],
    );
  }
}
