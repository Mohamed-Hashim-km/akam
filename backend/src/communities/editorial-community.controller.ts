import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

class UpdateReportStatusDto {
  @IsString()
  status: string; // PENDING | DISMISSED | ACTIONED
}

@ApiTags('Editorial — Community Moderation')
@Controller('editorial/community')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EDITOR', 'ADMIN')
@ApiBearerAuth()
export class EditorialCommunityController {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Community Report Queue ───────────────────────────────────────────────
  @Get('reports')
  @ApiOperation({ summary: '[EDITOR/ADMIN] Get community report queue' })
  @ApiQuery({ name: 'status', enum: ['PENDING', 'DISMISSED', 'ACTIONED', 'ALL'], required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getReports(
    @Query('status') status = 'PENDING',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit)));
    const offset = (pageNum - 1) * limitNum;

    const whereStatus =
      status.toUpperCase() !== 'ALL'
        ? `AND r.status = '${status.toUpperCase()}'`
        : '';

    const [data, countRow] = await Promise.all([
      this.prisma.query(`
        SELECT
          r.id, r."postId", r."commentId", r."reporterId",
          r.reason, r.details, r.status, r."createdAt", r."updatedAt",
          p.title AS "postTitle",
          c.body AS "commentBody",
          u.name AS "reporterName", u.email AS "reporterEmail"
        FROM community_report r
        LEFT JOIN community_post p ON p.id = r."postId"
        LEFT JOIN community_comment c ON c.id = r."commentId"
        JOIN "user" u ON u.id = r."reporterId"
        WHERE 1=1 ${whereStatus}
        ORDER BY r."createdAt" DESC
        LIMIT $1 OFFSET $2
      `, [limitNum, offset]),
      this.prisma.queryOne<{ count: string }>(`
        SELECT COUNT(*) AS count
        FROM community_report r
        WHERE 1=1 ${whereStatus}
      `, []),
    ]);

    const total = parseInt(countRow?.count ?? '0', 10);
    return {
      data,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    };
  }

  @Patch('reports/:reportId')
  @ApiOperation({ summary: '[EDITOR/ADMIN] Update community report status' })
  async updateReportStatus(
    @Param('reportId') reportId: string,
    @Body() dto: UpdateReportStatusDto,
    @Request() req: any,
  ) {
    const existing = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_report WHERE id = $1`,
      [reportId],
    );
    if (!existing) throw new NotFoundException('Report not found');

    await this.prisma.execute(
      `UPDATE community_report
       SET status = $1, "reviewedById" = $2, "reviewedAt" = now(), "updatedAt" = now()
       WHERE id = $3`,
      [dto.status, req.user.id, reportId],
    );
    return { reportId, status: dto.status };
  }

  // ─── Lock / Unlock Thread ─────────────────────────────────────────────────
  @Patch('posts/:postId/lock')
  @ApiOperation({ summary: '[EDITOR/ADMIN] Toggle thread lock — prevents new comments' })
  async lockPost(@Param('postId') postId: string, @Request() req: any) {
    const post = await this.prisma.queryOne<{ id: string; isLocked: boolean }>(
      `SELECT id, "isLocked" FROM community_post WHERE id = $1`,
      [postId],
    );
    if (!post) throw new NotFoundException('Post not found');

    const newLock = !post.isLocked;
    await this.prisma.execute(
      `UPDATE community_post
       SET "isLocked" = $1,
           "lockedAt" = $2,
           "lockedById" = $3,
           "updatedAt" = now()
       WHERE id = $4`,
      [
        newLock,
        newLock ? new Date().toISOString() : null,
        newLock ? req.user.id : null,
        postId,
      ],
    );
    return { postId, isLocked: newLock, lockedBy: newLock ? req.user.id : null };
  }

  // ─── Pin / Unpin Post ─────────────────────────────────────────────────────
  @Patch('posts/:postId/pin')
  @ApiOperation({ summary: '[EDITOR/ADMIN] Toggle post pin — pinned posts appear at feed top' })
  async pinPost(@Param('postId') postId: string) {
    const post = await this.prisma.queryOne<{ id: string; isPinned: boolean }>(
      `SELECT id, "isPinned" FROM community_post WHERE id = $1`,
      [postId],
    );
    if (!post) throw new NotFoundException('Post not found');

    const newPin = !post.isPinned;
    await this.prisma.execute(
      `UPDATE community_post SET "isPinned" = $1, "updatedAt" = now() WHERE id = $2`,
      [newPin, postId],
    );
    return { postId, isPinned: newPin };
  }

  // ─── Remove Post ──────────────────────────────────────────────────────────
  @Patch('posts/:postId/remove')
  @ApiOperation({ summary: "[EDITOR/ADMIN] Remove a post (sets status to 'REMOVED', preserves data)" })
  async removePost(@Param('postId') postId: string) {
    const post = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_post WHERE id = $1`,
      [postId],
    );
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.execute(
      `UPDATE community_post
       SET status = 'REMOVED'::"PostStatus", "updatedAt" = now()
       WHERE id = $1`,
      [postId],
    );
    return { success: true, postId, status: 'REMOVED' };
  }

  // ─── Remove Comment (Soft Delete) ────────────────────────────────────────
  @Patch('comments/:commentId/remove')
  @ApiOperation({ summary: "[EDITOR/ADMIN] Soft-remove a comment — body redacted, replies preserved" })
  async removeComment(
    @Param('commentId') commentId: string,
    @Request() req: any,
  ) {
    const comment = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_comment WHERE id = $1`,
      [commentId],
    );
    if (!comment) throw new NotFoundException('Comment not found');

    await this.prisma.execute(
      `UPDATE community_comment
       SET "isRemoved" = true,
           "removedById" = $1,
           "removedAt" = now(),
           "updatedAt" = now()
       WHERE id = $2`,
      [req.user.id, commentId],
    );
    return { success: true, commentId, isRemoved: true };
  }
}
