import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';

export type NotificationType = 'STORY_SUBMITTED' | 'STORY_APPROVED' | 'STORY_REJECTED';

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

  async getUserNotifications(userId: string): Promise<NotificationRow[]> {
    return this.prisma.query<NotificationRow>(
      `SELECT id, type, message, read, "relatedStoryId", "createdAt"
       FROM notification
       WHERE "userId" = $1
       ORDER BY "createdAt" DESC
       LIMIT 50`,
      [userId],
    );
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

  async notifyAuthorOfApproval(authorId: string, storyTitle: string, storyId: string): Promise<void> {
    await this.createNotification(
      authorId,
      'STORY_APPROVED',
      `Congratulations! Your story "${storyTitle}" has been approved and published.`,
      storyId,
    );
  }

  async notifyAuthorOfRejection(authorId: string, storyTitle: string, storyId: string, note?: string): Promise<void> {
    const msg = note ? `Your story "${storyTitle}" was rejected with note: "${note}"` : `Your story "${storyTitle}" was rejected by editorial.`;
    await this.createNotification(
      authorId,
      'STORY_REJECTED',
      msg,
      storyId,
    );
  }
}
