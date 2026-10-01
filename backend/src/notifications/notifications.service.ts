import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

export type NotificationType =
  | 'STORY_SUBMITTED'
  | 'STORY_APPROVED'
  | 'STORY_REJECTED'
  | 'STORY_APPROVED_EMAGAZINE'
  | 'STORY_PUBLISHED_EMAGAZINE'
  | 'CONTENT_REPORTED'
  | 'CONTENT_DISPUTED'
  | 'REPORT_RESOLVED'
  | 'REPORT_DISMISSED'
  | 'CONTENT_REMOVED'
  | 'STUDENT_APPLICATION_SUBMITTED'
  | 'STUDENT_APPLICATION_APPROVED'
  | 'STUDENT_APPLICATION_REJECTED'
  | 'SUBSCRIPTION_GRANTED'
  | 'SUBSCRIPTION_CANCELLED';

export interface EditorialAuditLogRow {
  id: string;
  type: string;
  message: string;
  read: boolean;
  relatedStoryId: string | null;
  createdAt: string;
  targetUserId?: string | null;
  targetUserName?: string | null;
  targetUserEmail?: string | null;
  targetUserRole?: string | null;
  storyTitle?: string | null;
  storySlug?: string | null;
  storyStatus?: string | null;
  submissionType?: string | null;
}

export interface EditorialAuditLogsResult {
  data: EditorialAuditLogRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  stats: {
    totalEvents: number;
    submissionsCount: number;
    approvalsCount: number;
    moderationCount: number;
    studentPassCount: number;
    subscriptionsCount: number;
  };
}

type NotificationRow = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  relatedStoryId: string | null;
  createdAt: string;
};

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async getEditorialAuditLogs(params: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<EditorialAuditLogsResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['1=1'];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.category && params.category !== 'ALL') {
      const cat = params.category.toUpperCase();
      if (cat === 'SUBMISSIONS') {
        conditions.push(`n.type IN ('STORY_SUBMITTED', 'STORY_APPROVED', 'STORY_REJECTED', 'STORY_APPROVED_EMAGAZINE', 'STORY_PUBLISHED_EMAGAZINE')`);
      } else if (cat === 'APPROVALS') {
        conditions.push(`n.type IN ('STORY_APPROVED', 'STORY_APPROVED_EMAGAZINE', 'STORY_PUBLISHED_EMAGAZINE')`);
      } else if (cat === 'REJECTIONS') {
        conditions.push(`n.type IN ('STORY_REJECTED', 'CONTENT_REMOVED')`);
      } else if (cat === 'MODERATION') {
        conditions.push(`n.type IN ('CONTENT_REPORTED', 'CONTENT_DISPUTED', 'REPORT_RESOLVED', 'REPORT_DISMISSED', 'CONTENT_REMOVED')`);
      } else if (cat === 'STUDENT_PASS') {
        conditions.push(`(n.type IN ('STUDENT_APPLICATION_SUBMITTED', 'STUDENT_APPLICATION_APPROVED', 'STUDENT_APPLICATION_REJECTED') OR n.message ILIKE '%Student Scholar Pass%')`);
      } else if (cat === 'SUBSCRIPTIONS') {
        conditions.push(`n.type IN ('SUBSCRIPTION_GRANTED', 'SUBSCRIPTION_CANCELLED')`);
      }
    }

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      values.push(searchPattern);
      conditions.push(`(
        n.message ILIKE $${paramIndex} OR
        u.name ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        s.title ILIKE $${paramIndex}
      )`);
      paramIndex++;
    }

    const whereSql = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(DISTINCT n.id) AS count
      FROM notification n
      LEFT JOIN "user" u ON n."userId" = u.id
      LEFT JOIN story s ON n."relatedStoryId" = s.id
      WHERE ${whereSql}
    `;

    const dataQuery = `
      SELECT 
        n.id,
        n.type,
        n.message,
        n.read,
        n."relatedStoryId",
        n."createdAt",
        u.id AS "targetUserId",
        u.name AS "targetUserName",
        u.email AS "targetUserEmail",
        u.role AS "targetUserRole",
        s.title AS "storyTitle",
        s.slug AS "storySlug",
        s.status AS "storyStatus",
        s."submissionType" AS "submissionType"
      FROM notification n
      LEFT JOIN "user" u ON n."userId" = u.id
      LEFT JOIN story s ON n."relatedStoryId" = s.id
      WHERE ${whereSql}
      ORDER BY n."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataValues = [...values, limit, offset];

    const [totalRow, dataRows, statsRows] = await Promise.all([
      this.prisma.queryOne<{ count: string }>(countQuery, values),
      this.prisma.query<EditorialAuditLogRow>(dataQuery, dataValues),
      this.prisma.query<{
        type: string;
        count: string;
      }>(`
        SELECT type, COUNT(*) AS count
        FROM notification
        GROUP BY type
      `),
    ]);

    const total = parseInt(totalRow?.count ?? '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = offset + dataRows.length < total;

    const statsMap: Record<string, number> = {};
    let totalEvents = 0;
    for (const row of statsRows) {
      const c = parseInt(row.count, 10);
      statsMap[row.type] = c;
      totalEvents += c;
    }

    const submissionsCount =
      (statsMap['STORY_SUBMITTED'] || 0) +
      (statsMap['STORY_APPROVED'] || 0) +
      (statsMap['STORY_REJECTED'] || 0) +
      (statsMap['STORY_APPROVED_EMAGAZINE'] || 0) +
      (statsMap['STORY_PUBLISHED_EMAGAZINE'] || 0);

    const approvalsCount =
      (statsMap['STORY_APPROVED'] || 0) +
      (statsMap['STORY_APPROVED_EMAGAZINE'] || 0) +
      (statsMap['STORY_PUBLISHED_EMAGAZINE'] || 0);

    const moderationCount =
      (statsMap['CONTENT_REPORTED'] || 0) +
      (statsMap['CONTENT_DISPUTED'] || 0) +
      (statsMap['REPORT_RESOLVED'] || 0) +
      (statsMap['REPORT_DISMISSED'] || 0) +
      (statsMap['CONTENT_REMOVED'] || 0);

    const studentPassCount =
      (statsMap['STUDENT_APPLICATION_SUBMITTED'] || 0) +
      (statsMap['STUDENT_APPLICATION_APPROVED'] || 0) +
      (statsMap['STUDENT_APPLICATION_REJECTED'] || 0);

    const subscriptionsCount =
      (statsMap['SUBSCRIPTION_GRANTED'] || 0) +
      (statsMap['SUBSCRIPTION_CANCELLED'] || 0);

    return {
      data: dataRows,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
      stats: {
        totalEvents,
        submissionsCount,
        approvalsCount,
        moderationCount,
        studentPassCount,
        subscriptionsCount,
      },
    };
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: NotificationRow[];
    meta: { page: number; limit: number; total: number; hasMore: boolean };
  }> {
    const offset = (page - 1) * limit;

    const [totalRow, data] = await Promise.all([
      this.prisma.queryOne<{ count: string }>(
        `SELECT COUNT(*) AS count FROM notification WHERE "userId" = $1`,
        [userId],
      ),
      this.prisma.query<NotificationRow>(
        `SELECT id, type, message, read, "relatedStoryId", "createdAt"
         FROM notification
         WHERE "userId" = $1
         ORDER BY "createdAt" DESC
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset],
      ),
    ]);

    const total = parseInt(totalRow?.count ?? '0', 10);
    const hasMore = offset + data.length < total;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        hasMore,
      },
    };
  }

  async markAsRead(id: string, userId: string): Promise<{ success: boolean }> {
    const count = await this.prisma.execute(
      `UPDATE notification SET read = true WHERE id = $1 AND "userId" = $2`,
      [id, userId],
    );
    return { success: count > 0 };
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    await this.prisma.execute(
      `UPDATE notification SET read = true WHERE "userId" = $1 AND read = false`,
      [userId],
    );
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const row = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM notification WHERE "userId" = $1 AND read = false`,
      [userId],
    );
    return parseInt(row?.count ?? '0', 10);
  }

  async createNotification(
    userId: string,
    type: NotificationType,
    message: string,
    relatedStoryId?: string,
  ): Promise<void> {
    await this.prisma.execute(
      `INSERT INTO notification (id, "userId", type, message, read, "relatedStoryId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2::"NotificationType", $3, false, $4, now())`,
      [userId, type, message, relatedStoryId ?? null],
    );
  }

  async notifyEditorsOfSubmission(storyTitle: string, storyId: string): Promise<void> {
    const editors = await this.prisma.query<{ id: string }>(
      `SELECT id FROM "user" WHERE role IN ('EDITOR', 'ADMIN')`,
    );

    for (const editor of editors) {
      await this.createNotification(
        editor.id,
        'STORY_SUBMITTED',
        `New story submitted for review: "${storyTitle}"`,
        storyId,
      );
    }
  }

  async notifyEditorsOfReport(targetTitle: string, reason: string, storyId?: string): Promise<void> {
    const editors = await this.prisma.query<{ id: string }>(
      `SELECT id FROM "user" WHERE role IN ('EDITOR', 'ADMIN', 'MODERATOR')`,
    );

    for (const editor of editors) {
      await this.createNotification(
        editor.id,
        'CONTENT_REPORTED',
        `Content Flagged: "${targetTitle}" was reported for "${reason}". Please review in Content Moderation.`,
        storyId,
      );
    }
  }

  async notifyReporterOfStatus(
    reporterId: string,
    storyTitle: string,
    status: 'RESOLVED' | 'DISMISSED',
    storyId?: string,
  ): Promise<void> {
    const type: NotificationType = status === 'DISMISSED' ? 'REPORT_DISMISSED' : 'REPORT_RESOLVED';
    const message =
      status === 'DISMISSED'
        ? `Your report regarding "${storyTitle}" was reviewed and dismissed by the editorial team.`
        : `Your report regarding "${storyTitle}" was reviewed and resolved by our editorial team. Appropriate action has been taken.`;

    await this.createNotification(reporterId, type, message, storyId);
  }

  async notifyAuthorOfDispute(
    authorId: string,
    storyTitle: string,
    reason: string,
    storyId?: string,
  ): Promise<void> {
    await this.createNotification(
      authorId,
      'CONTENT_DISPUTED',
      `A content dispute has been submitted regarding your work "${storyTitle}". Our editorial team is currently reviewing it.`,
      storyId,
    );
  }

  async notifyReporterOfDisputeSubmission(
    reporterId: string,
    storyTitle: string,
    storyId?: string,
  ): Promise<void> {
    await this.createNotification(
      reporterId,
      'CONTENT_DISPUTED',
      `Your dispute regarding "${storyTitle}" has been received. Our editorial team will review the claim shortly.`,
      storyId,
    );
  }

  async notifyAuthorOfDisputeResolution(
    authorId: string,
    storyTitle: string,
    status: 'RESOLVED' | 'DISMISSED',
    storyId?: string,
  ): Promise<void> {
    const message =
      status === 'DISMISSED'
        ? `The dispute regarding your work "${storyTitle}" has been reviewed and dismissed by the editorial team.`
        : `The dispute regarding your work "${storyTitle}" has been resolved by our editorial team.`;

    await this.createNotification(
      authorId,
      status === 'DISMISSED' ? 'REPORT_DISMISSED' : 'REPORT_RESOLVED',
      message,
      storyId,
    );
  }

  async notifyAuthorOfContentRemoval(
    authorId: string,
    contentTitle: string,
    isComment: boolean = false,
    storyId?: string,
  ): Promise<void> {
    const message = isComment
      ? `Your comment on "${contentTitle}" was removed by editorial moderation due to community guidelines.`
      : `Your story "${contentTitle}" was removed following an editorial moderation review.`;

    await this.createNotification(authorId, 'CONTENT_REMOVED', message, storyId);
  }

  async notifyAuthorOfEmagazineApproval(authorId: string, storyTitle: string, storyId: string): Promise<void> {
    await this.createNotification(
      authorId,
      'STORY_APPROVED_EMAGAZINE',
      `Congratulations! Your submission "${storyTitle}" has been approved for the AKAM E-Magazine edition.`,
      storyId,
    );
  }

  async notifyAuthorOfEmagazinePublished(authorId: string, storyTitle: string, storyId: string): Promise<void> {
    await this.createNotification(
      authorId,
      'STORY_PUBLISHED_EMAGAZINE',
      `Congratulations! Your submission "${storyTitle}" has been officially published in the AKAM E-Magazine edition!`,
      storyId,
    );
  }

  async notifyAuthorOfApproval(authorId: string, storyTitle: string, storyId: string): Promise<void> {
    await this.createNotification(
      authorId,
      'STORY_APPROVED',
      `Congratulations! Your story "${storyTitle}" has been approved and published.`,
      storyId,
    );
  }

  async notifyAuthorOfRejection(authorId: string, storyTitle: string, storyId: string, note?: string): Promise<void> {
    const isUnpublish = note?.toLowerCase().includes('unpublish') || note?.toLowerCase() === 'unpublish';
    const hasReason = note && note.toLowerCase() !== 'unpublish';
    const msg = isUnpublish && !hasReason
      ? `Your story "${storyTitle}" has been unpublished from the public catalog by the editorial team.`
      : isUnpublish || (note && hasReason)
        ? `Your story "${storyTitle}" has been unpublished from the public catalog. Reason: "${hasReason ? note : note}"`
        : note
          ? `Your story "${storyTitle}" was rejected with note: "${note}"`
          : `Your story "${storyTitle}" was rejected by editorial.`;
    await this.createNotification(
      authorId,
      'STORY_REJECTED',
      msg,
      storyId,
    );
  }

  async notifyEditorsOfStudentApplication(
    applicantName: string,
    institution: string,
    referenceId: string,
  ): Promise<void> {
    const editors = await this.prisma.query<{ id: string }>(
      `SELECT id FROM "user" WHERE role IN ('EDITOR', 'ADMIN')`,
    );

    for (const editor of editors) {
      await this.createNotification(
        editor.id,
        'STUDENT_APPLICATION_SUBMITTED',
        `New Student Scholar Pass Application: "${applicantName}" (${institution}) submitted credentials for review [Ref: ${referenceId}].`,
      );
    }
  }

  async notifySubscriptionGranted(
    userId: string,
    durationMonths: number,
    isStudent: boolean,
    endDate?: string | Date | null,
  ): Promise<void> {
    const durationText = `${durationMonths} Month${durationMonths === 1 ? '' : 's'}`;
    let validityText = '';

    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        const formattedDate = end.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        validityText = ` (valid until ${formattedDate})`;
      }
    }

    const planName = isStudent
      ? 'Student Scholar Pass'
      : `${durationMonths}-Month Digital Pass`;

    const message = `🎉 Your ${planName} is active for ${durationText}${validityText}.`;

    await this.createNotification(userId, 'SUBSCRIPTION_GRANTED', message);
  }

  async notifyStudentApplicationApproved(
    userId: string,
    durationMonths: number = 6,
    endDate?: string | Date | null,
  ): Promise<void> {
    let validityText = '';
    if (endDate) {
      const end = new Date(endDate);
      if (!isNaN(end.getTime())) {
        const formattedDate = end.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        validityText = ` (valid until ${formattedDate})`;
      }
    }
    const message = `🎓 Congratulations! Your Student Scholar Pass application has been approved${validityText}. You have full complimentary access to the digital catalog.`;
    await this.createNotification(userId, 'STUDENT_APPLICATION_APPROVED', message);
  }

  async notifyStudentApplicationRejected(userId: string, reason?: string): Promise<void> {
    const reasonText = reason?.trim() ? ` Reason: "${reason.trim()}"` : '';
    const message = `Your Student Scholar Pass application was not approved by the editorial team.${reasonText} You can review guidelines and resubmit with updated credentials.`;
    await this.createNotification(userId, 'STUDENT_APPLICATION_REJECTED', message);
  }

  async notifySubscriptionCancelled(userId: string): Promise<void> {
    const message = `Your Akam Digital subscription pass has been cancelled.`;
    await this.createNotification(userId, 'SUBSCRIPTION_CANCELLED', message);
  }
}
