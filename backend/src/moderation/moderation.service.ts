import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportStatusDto } from './dto/update-report-status.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

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
  authorResponse: string | null;
  authorRespondedAt: string | null;
  disputeExpiresAt: string | null;
  disputedAt: string | null;
  editorialNote: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class ModerationService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    try {
      await this.prisma.execute(`
        CREATE TABLE IF NOT EXISTS contact_inquiry (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          subject TEXT NOT NULL,
          message TEXT NOT NULL,
          status TEXT DEFAULT 'PENDING',
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
      `);
      await this.checkAndUnpublishExpiredDisputes();
    } catch (e) {
      console.error('Failed to initialize contact_inquiry table / sweep expired disputes', e);
    }
  }

  async checkAndUnpublishExpiredDisputes(): Promise<number> {
    try {
      const expired = await this.prisma.query<{
        reportId: string;
        storyId: string;
        storyTitle: string;
        authorId: string;
      }>(
        `SELECT r.id AS "reportId", r."storyId", s.title AS "storyTitle", s."authorId"
         FROM story_report r
         JOIN story s ON s.id = r."storyId"
         WHERE r.status = 'DISPUTED'
           AND r."authorResponse" IS NULL
           AND (
             r."disputeExpiresAt" <= now() OR
             (r."disputedAt" IS NOT NULL AND r."disputedAt" <= now() - INTERVAL '30 days')
           )
           AND s.status = 'DISPUTED'::"StoryStatus"`,
      );

      for (const item of expired) {
        // 1. Unpublish the work
        await this.prisma.execute(
          `UPDATE story
           SET status = 'UNPUBLISHED'::"StoryStatus",
               "rejectionNote" = 'Unpublished automatically: 30-day dispute clarification window elapsed without author response.',
               "updatedAt" = now()
           WHERE id = $1`,
          [item.storyId],
        );

        // 2. Mark report as RESOLVED (Actioned)
        await this.prisma.execute(
          `UPDATE story_report
           SET status = 'RESOLVED',
               "editorialNote" = COALESCE("editorialNote", '') || ' [Auto-unpublished: 30 days expired without author response]',
               "updatedAt" = now()
           WHERE id = $1`,
          [item.reportId],
        );

        // 3. Notify Author
        if (item.authorId) {
          await this.notificationsService.createNotification(
            item.authorId,
            'CONTENT_REMOVED',
            `Your work "${item.storyTitle}" has been unpublished automatically because no response was provided to the dispute within 30 days.`,
            item.storyId,
          );
        }
      }

      return expired.length;
    } catch (e) {
      console.error('Error checking expired disputes', e);
      return 0;
    }
  }

  async createReport(reporterId: string, targetStoryId: string, dto: CreateReportDto) {
    const story = await this.prisma.queryOne<{ id: string; title: string; authorId: string }>(
      `SELECT id, title, "authorId" FROM story WHERE id = $1 OR slug = $1 LIMIT 1`,
      [targetStoryId],
    );
    if (!story) throw new NotFoundException('Story not found');

    const report = await this.prisma.queryOne<{ id: string }>(
      `INSERT INTO story_report (id, "storyId", "reporterId", reason, details, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'PENDING', now(), now())
       RETURNING id, "storyId", "reporterId", reason, details, status, "createdAt"`,
      [story.id, reporterId, dto.reason, dto.details ?? null],
    );

    try {
      const isDispute =
        dto.reason?.trim().toUpperCase() === 'DISPUTE' ||
        dto.reason?.trim().toUpperCase().includes('DISPUTE');

      // 1. Notify Editors and Moderators
      const labelReason = isDispute ? 'Dispute / Ownership Claim' : dto.reason;
      await this.notificationsService.notifyEditorsOfReport(story.title, labelReason, story.id);

      // 2. Notify Reporter with receipt confirmation for dispute
      if (isDispute) {
        await this.notificationsService.notifyReporterOfDisputeSubmission(reporterId, story.title, story.id);
      }

      // 3. Notify Author of the work (if not reporting own story)
      if (story.authorId && story.authorId !== reporterId) {
        if (isDispute) {
          await this.notificationsService.notifyAuthorOfDispute(story.authorId, story.title, dto.reason, story.id);
        }
      }
    } catch (e) {
      console.error('Error sending report notifications', e);
    }

    return report!;
  }

  async createCommentReport(reporterId: string, commentId: string, dto: CreateReportDto) {
    const comment = await this.prisma.queryOne<{ id: string; storyId: string; storyTitle: string }>(
      `SELECT c.id, c."storyId", s.title AS "storyTitle"
       FROM story_comment c
       LEFT JOIN story s ON s.id = c."storyId"
       WHERE c.id = $1 LIMIT 1`,
      [commentId],
    );
    if (!comment) throw new NotFoundException('Comment not found');

    const report = await this.prisma.queryOne<{ id: string }>(
      `INSERT INTO story_report (id, "storyId", "commentId", "reporterId", reason, details, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'PENDING', now(), now())
       RETURNING id, "storyId", "commentId", "reporterId", reason, details, status, "createdAt"`,
      [comment.storyId, commentId, reporterId, dto.reason, dto.details ?? null],
    );

    try {
      const displayTitle = comment.storyTitle ? `Comment on "${comment.storyTitle}"` : 'A user comment';
      await this.notificationsService.notifyEditorsOfReport(displayTitle, dto.reason, comment.storyId);
    } catch (e) {
      console.error('Error sending comment report notifications', e);
    }

    return report!;
  }

  async getReports(options: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    search?: string;
  } = {}) {
    await this.checkAndUnpublishExpiredDisputes();

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
         r.id, r."storyId", r."commentId", r."reporterId", r.reason, r.details, r.status,
         r."authorResponse", r."authorRespondedAt", r."disputeExpiresAt", r."disputedAt", r."editorialNote",
         r."createdAt", r."updatedAt",
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
    const existing = await this.prisma.queryOne<{
      id: string;
      reporterId: string;
      storyId: string | null;
      commentId: string | null;
      storyTitle: string | null;
      reason: string;
      authorId: string | null;
    }>(
      `SELECT r.id, r."reporterId", r."storyId", r."commentId", r.reason, s.title AS "storyTitle", s."authorId"
       FROM story_report r
       LEFT JOIN story s ON s.id = r."storyId"
       WHERE r.id = $1`,
      [reportId],
    );
    if (!existing) throw new NotFoundException('Report not found');

    const contentTitle = existing.storyTitle || 'the reported content';

    if (dto.status === 'DISPUTED') {
      if (!existing.storyId) {
        throw new NotFoundException('Dispute action is only available for work reports');
      }

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30-day response window

      // 1. Mark report as DISPUTED
      await this.prisma.execute(
        `UPDATE story_report
         SET status = 'DISPUTED',
             "disputedAt" = now(),
             "disputeExpiresAt" = $1,
             "editorialNote" = $2,
             "updatedAt" = now()
         WHERE id = $3`,
        [expiresAt, dto.editorialNote || null, reportId],
      );

      // 2. Hide story from public catalog by setting status to DISPUTED
      await this.prisma.execute(
        `UPDATE story SET status = 'DISPUTED'::"StoryStatus", "updatedAt" = now() WHERE id = $1`,
        [existing.storyId],
      );

      // 3. Notify Author that work is hidden & must respond within 30 days
      if (existing.authorId) {
        const dateStr = expiresAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        await this.notificationsService.createNotification(
          existing.authorId,
          'CONTENT_DISPUTED',
          `Your work "${contentTitle}" has been placed under dispute review and is temporarily hidden. Please submit your response/clarification within 30 days (by ${dateStr}).`,
          existing.storyId,
        );
      }

      // 4. Notify Reporter
      await this.notificationsService.createNotification(
        existing.reporterId,
        'CONTENT_DISPUTED',
        `Your report regarding "${contentTitle}" has been placed under active dispute review. The work has been hidden from public access pending investigation.`,
        existing.storyId,
      );

      return { id: reportId, status: 'DISPUTED' };
    }

    if (dto.status === 'RESOLVED') {
      const action = dto.action || 'RESTORE';

      if (action === 'UNPUBLISH') {
        await this.prisma.execute(
          `UPDATE story_report SET status = 'RESOLVED', "editorialNote" = COALESCE($1, "editorialNote"), "updatedAt" = now() WHERE id = $2`,
          [dto.editorialNote || null, reportId],
        );
        if (existing.storyId) {
          await this.prisma.execute(
            `UPDATE story SET status = 'UNPUBLISHED'::"StoryStatus", "rejectionNote" = $1, "updatedAt" = now() WHERE id = $2`,
            [dto.editorialNote || 'Unpublished following editorial dispute investigation.', existing.storyId],
          );
        }
        if (existing.authorId) {
          await this.notificationsService.createNotification(
            existing.authorId,
            'CONTENT_REMOVED',
            `Your work "${contentTitle}" has been unpublished from the public catalog following editorial dispute resolution.`,
            existing.storyId ?? undefined,
          );
        }
        await this.notificationsService.createNotification(
          existing.reporterId,
          'REPORT_RESOLVED',
          `The dispute regarding "${contentTitle}" has been resolved and the work has been unpublished.`,
          existing.storyId ?? undefined,
        );
      } else {
        // RESTORE: Restore to published APPROVED status
        await this.prisma.execute(
          `UPDATE story_report SET status = 'RESOLVED', "editorialNote" = COALESCE($1, "editorialNote"), "updatedAt" = now() WHERE id = $2`,
          [dto.editorialNote || null, reportId],
        );
        if (existing.storyId) {
          await this.prisma.execute(
            `UPDATE story SET status = 'APPROVED'::"StoryStatus", "updatedAt" = now() WHERE id = $1`,
            [existing.storyId],
          );
        }
        if (existing.authorId) {
          await this.notificationsService.createNotification(
            existing.authorId,
            'REPORT_RESOLVED',
            `The dispute regarding your work "${contentTitle}" has been resolved. Your work has been restored and is publicly accessible.`,
            existing.storyId ?? undefined,
          );
        }
        await this.notificationsService.createNotification(
          existing.reporterId,
          'REPORT_RESOLVED',
          `The report regarding "${contentTitle}" has been reviewed and resolved by our editorial team.`,
          existing.storyId ?? undefined,
        );
      }

      return { id: reportId, status: 'RESOLVED', action };
    }

    if (dto.status === 'DISMISSED') {
      await this.prisma.execute(
        `UPDATE story_report SET status = 'DISMISSED', "editorialNote" = COALESCE($1, "editorialNote"), "updatedAt" = now() WHERE id = $2`,
        [dto.editorialNote || null, reportId],
      );

      // If story was disputed, restore it to APPROVED
      if (existing.storyId) {
        await this.prisma.execute(
          `UPDATE story SET status = 'APPROVED'::"StoryStatus", "updatedAt" = now() WHERE id = $1 AND status = 'DISPUTED'::"StoryStatus"`,
          [existing.storyId],
        );
      }

      if (existing.authorId && existing.authorId !== existing.reporterId) {
        await this.notificationsService.createNotification(
          existing.authorId,
          'REPORT_DISMISSED',
          `The dispute regarding your work "${contentTitle}" was reviewed and dismissed by the editorial team. Your work remains active.`,
          existing.storyId ?? undefined,
        );
      }

      await this.notificationsService.createNotification(
        existing.reporterId,
        'REPORT_DISMISSED',
        `Your report regarding "${contentTitle}" was reviewed and dismissed by the editorial team.`,
        existing.storyId ?? undefined,
      );

      return { id: reportId, status: 'DISMISSED' };
    }

    return { id: reportId, status: dto.status };
  }

  async submitAuthorDisputeResponse(userId: string, storyId: string, responseText: string) {
    if (!responseText || !responseText.trim()) {
      throw new NotFoundException('Response text cannot be empty');
    }

    const story = await this.prisma.queryOne<{ id: string; title: string; authorId: string; status: string }>(
      `SELECT id, title, "authorId", status FROM story WHERE id = $1 OR slug = $1`,
      [storyId],
    );
    if (!story) throw new NotFoundException('Story not found');
    if (story.authorId !== userId) {
      throw new NotFoundException('Only the author of this work can submit a dispute response');
    }

    const activeReport = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM story_report WHERE "storyId" = $1 AND status = 'DISPUTED' ORDER BY "createdAt" DESC LIMIT 1`,
      [story.id],
    );
    if (!activeReport) {
      throw new NotFoundException('No active dispute found for this work');
    }

    await this.prisma.execute(
      `UPDATE story_report
       SET "authorResponse" = $1,
           "authorRespondedAt" = now(),
           "updatedAt" = now()
       WHERE id = $2`,
      [responseText.trim(), activeReport.id],
    );

    // Notify Editors and Moderators
    const editors = await this.prisma.query<{ id: string }>(
      `SELECT id FROM "user" WHERE role IN ('EDITOR', 'ADMIN', 'MODERATOR')`,
    );
    for (const editor of editors) {
      await this.notificationsService.createNotification(
        editor.id,
        'CONTENT_DISPUTED',
        `Dispute Response: The author of "${story.title}" has submitted their clarification/response to the dispute. Review it in Content Moderation.`,
        story.id,
      );
    }

    return { success: true, message: 'Your response has been submitted to the editorial team.' };
  }

  async getPendingCount(): Promise<{ count: number; disputedCount?: number }> {
    const [pendingRow, disputedRow] = await Promise.all([
      this.prisma.queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM story_report WHERE status = 'PENDING'`,
      ),
      this.prisma.queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM story_report WHERE status = 'DISPUTED'`,
      ),
    ]);
    return {
      count: parseInt(pendingRow?.count ?? '0', 10),
      disputedCount: parseInt(disputedRow?.count ?? '0', 10),
    };
  }

  async createContactInquiry(dto: { name: string; email: string; phone?: string; subject: string; message: string }) {
    await this.onModuleInit();
    const result = await this.prisma.queryOne(
      `INSERT INTO contact_inquiry (id, name, email, phone, subject, message, status, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, 'PENDING', now(), now())
       RETURNING id, name, email, phone, subject, message, status, "createdAt"`,
      [dto.name, dto.email, dto.phone ?? null, dto.subject || 'General Inquiry', dto.message],
    );
    return result!;
  }

  async getContactInquiries(options: { page?: number; limit?: number; search?: string; status?: string } = {}) {
    await this.onModuleInit();
    const page = Math.max(1, Number(options.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(options.limit) || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (options.status && options.status.trim() && options.status.toUpperCase() !== 'ALL') {
      params.push(options.status.trim().toUpperCase());
      conditions.push(`status = $${params.length}`);
    }

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim()}%`);
      const pIdx = params.length;
      conditions.push(`(name ILIKE $${pIdx} OR email ILIKE $${pIdx} OR subject ILIKE $${pIdx} OR message ILIKE $${pIdx})`);
    }

    const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM contact_inquiry ${whereSql}`,
      params,
    );

    const total = parseInt(countRow?.count ?? '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;

    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;
    const queryParams = [...params, limit, offset];

    const data = await this.prisma.query(
      `SELECT id, name, email, phone, subject, message, status, "createdAt", "updatedAt"
       FROM contact_inquiry
       ${whereSql}
       ORDER BY "createdAt" DESC
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

  async updateContactInquiryStatus(id: string, status: string) {
    await this.onModuleInit();
    await this.prisma.execute(
      `UPDATE contact_inquiry SET status = $1, "updatedAt" = now() WHERE id = $2`,
      [status, id],
    );
    return { id, status };
  }
}
