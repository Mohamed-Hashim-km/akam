import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Subject, Observable, interval, merge, map, filter } from 'rxjs';
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
  | 'SUBSCRIPTION_CANCELLED'
  | 'READ_UPDATE';

export interface EditorialAuditLogRow {
  id: string;
  type: string;
  category?: string;
  message: string;
  relatedStoryId: string | null;
  entityId?: string | null;
  entityType?: string | null;
  details?: any;
  createdAt: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
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
    editorialCount: number;
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
  private readonly logger = new Logger(NotificationsService.name);

  private readonly notificationEvents$ = new Subject<{
    id: string;
    userId: string;
    targetRole?: string;
    type: string;
    message: string;
    read: boolean;
    relatedStoryId?: string | null;
    createdAt: string;
  }>();

  constructor(private prisma: PrismaService) {}

  /**
   * Subscribe to real-time notification push events via Server-Sent Events (SSE).
   * Emits live events the moment any notification is created or updated in the backend (<10ms).
   */
  getNotificationStream(userId: string, userRole?: string): Observable<MessageEvent> {
    const live$ = this.notificationEvents$.asObservable().pipe(
      filter((e) => {
        // Direct recipient match
        if (e.userId === userId || e.userId === 'ALL' || e.userId === '*') {
          return true;
        }
        // If connected client is an editor/admin/moderator, also receive editorial broadcast notifications
        if (userRole && (userRole === 'EDITOR' || userRole === 'ADMIN' || userRole === 'MODERATOR')) {
          if (
            e.targetRole === 'EDITOR' ||
            e.targetRole === 'ADMIN' ||
            e.targetRole === 'ALL' ||
            e.userId === 'EDITORS'
          ) {
            return true;
          }
        }
        return false;
      }),
      map((event) => ({
        data: {
          type:
            event.type === 'READ_UPDATE'
              ? 'READ_UPDATE'
              : event.type === 'READ_ALL_UPDATE'
                ? 'READ_ALL_UPDATE'
                : 'NEW_NOTIFICATION',
          notification: event,
          timestamp: new Date().toISOString(),
        },
      } as MessageEvent)),
    );

    // Keep-alive heartbeat every 15 seconds to prevent browser/proxy timeouts
    const heartbeat$ = interval(15000).pipe(
      map(() => ({
        data: {
          type: 'HEARTBEAT',
          timestamp: new Date().toISOString(),
        },
      } as MessageEvent)),
    );

    return merge(live$, heartbeat$);
  }


  async recordEditorialAuditLog(params: {
    userId?: string | null;
    targetUserId?: string | null;
    type: string;
    category?: string;
    message: string;
    relatedStoryId?: string | null;
    entityId?: string | null;
    entityType?: string | null;
    details?: any;
  }): Promise<string> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const category = params.category || 'EDITORIAL';

    try {
      await this.prisma.execute(
        `INSERT INTO audit_log (id, "userId", "targetUserId", type, category, message, read, "relatedStoryId", "entityId", "entityType", details, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8, $9, $10, $11::timestamp)`,
        [
          id,
          params.userId ?? null,
          params.targetUserId ?? null,
          params.type,
          category,
          params.message,
          params.relatedStoryId ?? null,
          params.entityId ?? null,
          params.entityType ?? null,
          params.details ? JSON.stringify(params.details) : null,
          createdAt,
        ],
      );

      // Push real-time event to connected editors via SSE (<10ms)
      this.notificationEvents$.next({
        id,
        userId: params.userId || 'EDITORS',
        targetRole: 'EDITOR',
        type: params.type,
        message: params.message,
        read: false,
        relatedStoryId: params.relatedStoryId ?? null,
        createdAt,
      });
    } catch (err) {
      this.logger.error(`Failed to record editorial audit log for ${params.type}`, err);
    }

    return id;
  }

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
        conditions.push(`(a.category = 'SUBMISSIONS' OR a.type IN ('STORY_SUBMITTED', 'STORY_APPROVED', 'STORY_REJECTED', 'STORY_APPROVED_EMAGAZINE', 'STORY_PUBLISHED_EMAGAZINE'))`);
      } else if (cat === 'APPROVALS') {
        conditions.push(`(a.category = 'APPROVALS' OR a.type IN ('STORY_APPROVED', 'STORY_APPROVED_EMAGAZINE', 'STORY_PUBLISHED_EMAGAZINE', 'EDITION_CREATED', 'EDITION_TOGGLE_PUBLISH'))`);
      } else if (cat === 'REJECTIONS') {
        conditions.push(`(a.category = 'REJECTIONS' OR a.type IN ('STORY_REJECTED', 'CONTENT_REMOVED'))`);
      } else if (cat === 'MODERATION') {
        conditions.push(`(a.category = 'MODERATION' OR a.type IN ('CONTENT_REPORTED', 'CONTENT_DISPUTED', 'REPORT_RESOLVED', 'REPORT_DISMISSED', 'CONTENT_REMOVED', 'COMMUNITY_REPORT_ACTIONED', 'COMMUNITY_POST_LOCKED', 'COMMUNITY_POST_REMOVED', 'COMMUNITY_COMMENT_REMOVED'))`);
      } else if (cat === 'STUDENT_PASS') {
        conditions.push(`(a.category = 'STUDENT_PASS' OR a.type IN ('STUDENT_APPLICATION_SUBMITTED', 'STUDENT_APPLICATION_APPROVED', 'STUDENT_APPLICATION_REJECTED', 'STUDENT_PASS_GRANTED') OR a.message ILIKE '%Student Scholar Pass%')`);
      } else if (cat === 'SUBSCRIPTIONS') {
        conditions.push(`(a.category = 'SUBSCRIPTIONS' OR a.type IN ('SUBSCRIPTION_GRANTED', 'SUBSCRIPTION_CANCELLED'))`);
      } else if (cat === 'EDITORIAL') {
        conditions.push(`(a.category = 'EDITORIAL' OR a.type LIKE 'BOOK_%' OR a.type LIKE 'EDITION_%' OR a.type LIKE 'MEDIA_%' OR a.type LIKE 'EVENT_%' OR a.type LIKE 'CATEGORY_%' OR a.type LIKE 'REVIEW_%' OR a.type LIKE 'COMMUNITY_%' OR a.type LIKE 'USER_%' OR a.type LIKE 'AUTHOR_%' OR a.type LIKE 'SETTING_%' OR a.type LIKE 'EDITORS_NOTE_%' OR a.type LIKE 'INQUIRY_%')`);
      }
    }

    if (params.search && params.search.trim()) {
      const searchPattern = `%${params.search.trim()}%`;
      values.push(searchPattern);
      conditions.push(`(
        a.message ILIKE $${paramIndex} OR
        a.type ILIKE $${paramIndex} OR
        u.name ILIKE $${paramIndex} OR
        u.email ILIKE $${paramIndex} OR
        actor.name ILIKE $${paramIndex} OR
        actor.email ILIKE $${paramIndex} OR
        s.title ILIKE $${paramIndex}
      )`);
      paramIndex++;
    }

    const whereSql = conditions.join(' AND ');

    const countQuery = `
      SELECT COUNT(DISTINCT a.id) AS count
      FROM audit_log a
      LEFT JOIN "user" u ON a."targetUserId" = u.id
      LEFT JOIN "user" actor ON a."userId" = actor.id
      LEFT JOIN story s ON a."relatedStoryId" = s.id
      WHERE ${whereSql}
    `;

    const dataQuery = `
      SELECT 
        a.id,
        a.type,
        a.category,
        a.message,
        a."relatedStoryId",
        a."entityId",
        a."entityType",
        a.details,
        a."createdAt",
        actor.id AS "actorId",
        actor.name AS "actorName",
        actor.email AS "actorEmail",
        actor.role AS "actorRole",
        u.id AS "targetUserId",
        u.name AS "targetUserName",
        u.email AS "targetUserEmail",
        u.role AS "targetUserRole",
        s.title AS "storyTitle",
        s.slug AS "storySlug",
        s.status AS "storyStatus",
        s."submissionType" AS "submissionType"
      FROM audit_log a
      LEFT JOIN "user" u ON a."targetUserId" = u.id
      LEFT JOIN "user" actor ON a."userId" = actor.id
      LEFT JOIN story s ON a."relatedStoryId" = s.id
      WHERE ${whereSql}
      ORDER BY a."createdAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const dataValues = [...values, limit, offset];

    const [totalRow, dataRows, statsRows] = await Promise.all([
      this.prisma.queryOne<{ count: string }>(countQuery, values),
      this.prisma.query<EditorialAuditLogRow>(dataQuery, dataValues),
      this.prisma.query<{
        category: string;
        type: string;
        count: string;
      }>(`
        SELECT category, type, COUNT(*) AS count
        FROM audit_log
        GROUP BY category, type
      `),
    ]);

    const total = parseInt(totalRow?.count ?? '0', 10);
    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = offset + dataRows.length < total;

    const statsMap: Record<string, number> = {};
    const catMap: Record<string, number> = {};
    let totalEvents = 0;
    for (const row of statsRows) {
      const c = parseInt(row.count, 10);
      statsMap[row.type] = (statsMap[row.type] || 0) + c;
      catMap[row.category] = (catMap[row.category] || 0) + c;
      totalEvents += c;
    }

    const submissionsCount =
      (catMap['SUBMISSIONS'] || 0) ||
      ((statsMap['STORY_SUBMITTED'] || 0) +
      (statsMap['STORY_APPROVED'] || 0) +
      (statsMap['STORY_REJECTED'] || 0) +
      (statsMap['STORY_APPROVED_EMAGAZINE'] || 0) +
      (statsMap['STORY_PUBLISHED_EMAGAZINE'] || 0));

    const approvalsCount =
      (catMap['APPROVALS'] || 0) ||
      ((statsMap['STORY_APPROVED'] || 0) +
      (statsMap['STORY_APPROVED_EMAGAZINE'] || 0) +
      (statsMap['STORY_PUBLISHED_EMAGAZINE'] || 0));

    const moderationCount =
      (catMap['MODERATION'] || 0) ||
      ((statsMap['CONTENT_REPORTED'] || 0) +
      (statsMap['CONTENT_DISPUTED'] || 0) +
      (statsMap['REPORT_RESOLVED'] || 0) +
      (statsMap['REPORT_DISMISSED'] || 0) +
      (statsMap['CONTENT_REMOVED'] || 0));

    const studentPassCount =
      (catMap['STUDENT_PASS'] || 0) ||
      ((statsMap['STUDENT_APPLICATION_SUBMITTED'] || 0) +
      (statsMap['STUDENT_APPLICATION_APPROVED'] || 0) +
      (statsMap['STUDENT_APPLICATION_REJECTED'] || 0));

    const subscriptionsCount =
      (catMap['SUBSCRIPTIONS'] || 0) ||
      ((statsMap['SUBSCRIPTION_GRANTED'] || 0) +
      (statsMap['SUBSCRIPTION_CANCELLED'] || 0));

    const editorialCount = catMap['EDITORIAL'] || 0;

    return {
      data: dataRows.map((r) => ({
        ...r,
        message: r.message ? r.message.replace(/AKAM E-Magazine/g, 'AKAM Magazine') : r.message,
      })),
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
        editorialCount,
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
      data: data.map((r) => ({
        ...r,
        message: r.message ? r.message.replace(/AKAM E-Magazine/g, 'AKAM Magazine') : r.message,
      })),
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
    this.notificationEvents$.next({
      id,
      userId,
      type: 'READ_UPDATE',
      message: 'Notification marked as read',
      read: true,
      createdAt: new Date().toISOString(),
    });
    return { success: true };
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean }> {
    await this.prisma.execute(
      `UPDATE notification SET read = true WHERE "userId" = $1 AND read = false`,
      [userId],
    );
    this.notificationEvents$.next({
      id: 'ALL',
      userId,
      type: 'READ_ALL_UPDATE',
      message: 'All notifications marked as read',
      read: true,
      createdAt: new Date().toISOString(),
    });
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
    targetRole?: string,
  ): Promise<string> {
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await this.prisma.execute(
      `INSERT INTO notification (id, "userId", type, message, read, "relatedStoryId", "createdAt")
       VALUES ($1, $2, $3::"NotificationType", $4, false, $5, $6::timestamp)`,
      [id, userId, type, message, relatedStoryId ?? null, createdAt],
    );

    // Derive category for audit log
    let category = 'EDITORIAL';
    if (['STORY_SUBMITTED', 'STORY_APPROVED', 'STORY_REJECTED', 'STORY_APPROVED_EMAGAZINE', 'STORY_PUBLISHED_EMAGAZINE'].includes(type)) {
      category = 'SUBMISSIONS';
    } else if (['CONTENT_REPORTED', 'REPORT_RESOLVED', 'REPORT_DISMISSED', 'CONTENT_REMOVED', 'CONTENT_DISPUTED'].includes(type)) {
      category = 'MODERATION';
    } else if (['STUDENT_APPLICATION_SUBMITTED', 'STUDENT_APPLICATION_APPROVED', 'STUDENT_APPLICATION_REJECTED'].includes(type)) {
      category = 'STUDENT_PASS';
    } else if (['SUBSCRIPTION_GRANTED', 'SUBSCRIPTION_CANCELLED'].includes(type)) {
      category = 'SUBSCRIPTIONS';
    }

    try {
      await this.prisma.execute(
        `INSERT INTO audit_log (id, "userId", "targetUserId", type, category, message, read, "relatedStoryId", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8::timestamp)
         ON CONFLICT (id) DO NOTHING`,
        [id, userId, userId, type, category, message, relatedStoryId ?? null, createdAt],
      );
    } catch (e) {
      this.logger.error('Failed to sync notification to audit_log', e);
    }

    // Push realtime event immediately (< 10ms)
    this.notificationEvents$.next({
      id,
      userId,
      targetRole,
      type,
      message,
      read: false,
      relatedStoryId: relatedStoryId ?? null,
      createdAt,
    });

    return id;
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
        'EDITOR',
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
        'EDITOR',
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
      `Congratulations! Your submission "${storyTitle}" has been approved for the AKAM Magazine edition.`,
      storyId,
    );
  }

  async notifyAuthorOfEmagazinePublished(authorId: string, storyTitle: string, storyId: string): Promise<void> {
    await this.createNotification(
      authorId,
      'STORY_PUBLISHED_EMAGAZINE',
      `Congratulations! Your submission "${storyTitle}" has been officially published in the AKAM Magazine edition!`,
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
        undefined,
        'EDITOR',
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
