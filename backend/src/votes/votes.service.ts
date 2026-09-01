import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

type VoteValue = 'UP' | 'DOWN';

export interface VoteResult {
  voted: boolean;
  value: VoteValue | null;
  upvotes: number;
  downvotes: number;
  score: number;
}

@Injectable()
export class VotesService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Post Vote ───────────────────────────────────────────────────────────
  async castPostVote(
    userId: string,
    postId: string,
    value: VoteValue,
  ): Promise<VoteResult> {
    const post = await this.prisma.queryOne<{ id: string; upvotes: number; downvotes: number }>(
      `SELECT id, upvotes, downvotes FROM community_post WHERE id = $1`,
      [postId],
    );
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.queryOne<{ id: string; value: string }>(
      `SELECT id, value FROM post_vote WHERE "userId" = $1 AND "postId" = $2`,
      [userId, postId],
    );

    if (existing) {
      if (existing.value === value) {
        // Toggle OFF — remove vote
        await this.prisma.execute(`DELETE FROM post_vote WHERE id = $1`, [existing.id]);
        await this.prisma.execute(
          `UPDATE community_post
           SET ${value === 'UP' ? 'upvotes = GREATEST(upvotes - 1, 0)' : 'downvotes = GREATEST(downvotes - 1, 0)'},
               "updatedAt" = now()
           WHERE id = $1`,
          [postId],
        );
        const updated = await this.getPostCounts(postId);
        return { voted: false, value: null, ...updated };
      } else {
        // Changed direction
        await this.prisma.execute(
          `UPDATE post_vote SET value = $1::"VoteValue" WHERE id = $2`,
          [value, existing.id],
        );
        const incCol = value === 'UP' ? 'upvotes' : 'downvotes';
        const decCol = value === 'UP' ? 'downvotes' : 'upvotes';
        await this.prisma.execute(
          `UPDATE community_post
           SET "${incCol}" = "${incCol}" + 1,
               "${decCol}" = GREATEST("${decCol}" - 1, 0),
               "updatedAt" = now()
           WHERE id = $1`,
          [postId],
        );
        const updated = await this.getPostCounts(postId);
        return { voted: true, value, ...updated };
      }
    }

    // New vote
    await this.prisma.execute(
      `INSERT INTO post_vote (id, "userId", "postId", value, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3::"VoteValue", now())`,
      [userId, postId, value],
    );
    await this.prisma.execute(
      `UPDATE community_post
       SET ${value === 'UP' ? 'upvotes = upvotes + 1' : 'downvotes = downvotes + 1'},
           "updatedAt" = now()
       WHERE id = $1`,
      [postId],
    );
    const updated = await this.getPostCounts(postId);
    return { voted: true, value, ...updated };
  }

  private async getPostCounts(postId: string): Promise<{ upvotes: number; downvotes: number; score: number }> {
    const row = await this.prisma.queryOne<{ upvotes: number; downvotes: number }>(
      `SELECT upvotes, downvotes FROM community_post WHERE id = $1`,
      [postId],
    );
    const upvotes = Number(row?.upvotes ?? 0);
    const downvotes = Number(row?.downvotes ?? 0);
    return { upvotes, downvotes, score: upvotes - downvotes };
  }

  // ─── Comment Vote ────────────────────────────────────────────────────────
  async castCommentVote(
    userId: string,
    commentId: string,
    value: VoteValue,
  ): Promise<VoteResult> {
    const comment = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_comment WHERE id = $1 AND "isRemoved" = false`,
      [commentId],
    );
    if (!comment) throw new NotFoundException('Comment not found');

    const existing = await this.prisma.queryOne<{ id: string; value: string }>(
      `SELECT id, value FROM comment_vote WHERE "userId" = $1 AND "commentId" = $2`,
      [userId, commentId],
    );

    if (existing) {
      if (existing.value === value) {
        // Toggle OFF
        await this.prisma.execute(`DELETE FROM comment_vote WHERE id = $1`, [existing.id]);
        await this.prisma.execute(
          `UPDATE community_comment
           SET ${value === 'UP' ? 'upvotes = GREATEST(upvotes - 1, 0)' : 'downvotes = GREATEST(downvotes - 1, 0)'},
               "updatedAt" = now()
           WHERE id = $1`,
          [commentId],
        );
        const updated = await this.getCommentCounts(commentId);
        return { voted: false, value: null, ...updated };
      } else {
        // Change direction
        await this.prisma.execute(
          `UPDATE comment_vote SET value = $1::"VoteValue" WHERE id = $2`,
          [value, existing.id],
        );
        const incCol = value === 'UP' ? 'upvotes' : 'downvotes';
        const decCol = value === 'UP' ? 'downvotes' : 'upvotes';
        await this.prisma.execute(
          `UPDATE community_comment
           SET "${incCol}" = "${incCol}" + 1,
               "${decCol}" = GREATEST("${decCol}" - 1, 0),
               "updatedAt" = now()
           WHERE id = $1`,
          [commentId],
        );
        const updated = await this.getCommentCounts(commentId);
        return { voted: true, value, ...updated };
      }
    }

    // New vote
    await this.prisma.execute(
      `INSERT INTO comment_vote (id, "userId", "commentId", value, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3::"VoteValue", now())`,
      [userId, commentId, value],
    );
    await this.prisma.execute(
      `UPDATE community_comment
       SET ${value === 'UP' ? 'upvotes = upvotes + 1' : 'downvotes = downvotes + 1'},
           "updatedAt" = now()
       WHERE id = $1`,
      [commentId],
    );
    const updated = await this.getCommentCounts(commentId);
    return { voted: true, value, ...updated };
  }

  private async getCommentCounts(commentId: string): Promise<{ upvotes: number; downvotes: number; score: number }> {
    const row = await this.prisma.queryOne<{ upvotes: number; downvotes: number }>(
      `SELECT upvotes, downvotes FROM community_comment WHERE id = $1`,
      [commentId],
    );
    const upvotes = Number(row?.upvotes ?? 0);
    const downvotes = Number(row?.downvotes ?? 0);
    return { upvotes, downvotes, score: upvotes - downvotes };
  }
}
