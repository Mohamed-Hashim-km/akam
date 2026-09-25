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
