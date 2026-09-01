import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportStatusDto } from './dto/update-report-status.dto.js';

export interface ReportRow {
  id: string;
  storyId: string | null;
  commentId: string | null;
  storyTitle: string | null;
  storySlug: string | null;
  commentContent: string | null;
  reporterId: string;
  reporterName: string | null;
  reporterEmail: string;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ModerationService {
  constructor(private prisma: PrismaService) {}

  async createReport(reporterId: string, targetStoryId: string, dto: CreateReportDto) {
    const story = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM story WHERE id = $1 OR slug = $1 LIMIT 1`,
      [targetStoryId],
    );
    if (!story) throw new NotFoundException('Story not found');

    const report = await this.prisma.queryOne<{ id: string }>(
      `INSERT INTO story_report (id, "storyId", "reporterId", reason, details, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'PENDING', now(), now())
       RETURNING id, "storyId", "reporterId", reason, details, status, "createdAt"`,
      [story.id, reporterId, dto.reason, dto.details ?? null],
    );

    return report!;
  }

  async createCommentReport(reporterId: string, commentId: string, dto: CreateReportDto) {
    const comment = await this.prisma.queryOne<{ id: string; storyId: string }>(
      `SELECT id, "storyId" FROM story_comment WHERE id = $1 LIMIT 1`,
      [commentId],
    );
    if (!comment) throw new NotFoundException('Comment not found');

    const report = await this.prisma.queryOne<{ id: string }>(
      `INSERT INTO story_report (id, "storyId", "commentId", "reporterId", reason, details, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'PENDING', now(), now())
       RETURNING id, "storyId", "commentId", "reporterId", reason, details, status, "createdAt"`,
      [comment.storyId, commentId, reporterId, dto.reason, dto.details ?? null],
    );

    return report!;
  }

  async getReports(options: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  } = {}) {
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (options.status && options.status.trim() && options.status.toUpperCase() !== 'ALL') {
      params.push(options.status.trim().toUpperCase());
      conditions.push(`r.status = $${params.length}`);
    }

    if (options.type && options.type.trim().toUpperCase() === 'STORY') {
      conditions.push(`r."commentId" IS NULL`);
    } else if (options.type && options.type.trim().toUpperCase() === 'COMMENT') {
      conditions.push(`r."commentId" IS NOT NULL`);
    }

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim()}%`);
      const pIdx = params.length;
      conditions.push(
        `(s.title ILIKE $${pIdx} OR c.content ILIKE $${pIdx} OR u.email ILIKE $${pIdx} OR u.name ILIKE $${pIdx} OR r.reason ILIKE $${pIdx})`
      );
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM story_report r
       LEFT JOIN story s ON s.id = r."storyId"
       LEFT JOIN story_comment c ON c.id = r."commentId"
       JOIN "user" u ON u.id = r."reporterId"
       ${whereSql}`,
      params,
    );

    const total = parseInt(countRow?.count ?? '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    const queryParams = [...params, limit, offset];

    const data = await this.prisma.query<ReportRow>(
      `SELECT
         r.id, r."storyId", r."commentId", r."reporterId", r.reason, r.details, r.status, r."createdAt", r."updatedAt",
         s.title AS "storyTitle", s.slug AS "storySlug",
         c.content AS "commentContent",
         u.name AS "reporterName", u.email AS "reporterEmail"
       FROM story_report r
       LEFT JOIN story s ON s.id = r."storyId"
       LEFT JOIN story_comment c ON c.id = r."commentId"
       JOIN "user" u ON u.id = r."reporterId"
       ${whereSql}
       ORDER BY r."createdAt" DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      queryParams,
    );

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  async updateReportStatus(reportId: string, dto: UpdateReportStatusDto) {
    const existing = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM story_report WHERE id = $1`,
      [reportId],
    );
    if (!existing) throw new NotFoundException('Report not found');

    await this.prisma.execute(
      `UPDATE story_report SET status = $1, "updatedAt" = now() WHERE id = $2`,
      [dto.status, reportId],
    );

    return { id: reportId, status: dto.status };
  }
}
