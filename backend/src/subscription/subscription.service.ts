import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { MailService } from '../mail/mail.service.js';

export interface SubscriptionRow {
  id: string;
  userId: string;
  planType: string;
  status: string;
  startDate: Date;
  endDate: Date;
  isStudent: boolean;
  txnId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) { }

  async getByUserId(userId: string): Promise<SubscriptionRow | null> {
    const sub = await this.prisma.queryOne<SubscriptionRow>(
      `SELECT * FROM subscription WHERE "userId" = $1`,
      [userId],
    );

    // If subscription already exists (ACTIVE, CANCELLED, or EXPIRED), return it directly.
    // Do NOT auto-activate if a subscription record already exists and was cancelled/expired.
    if (sub) {
      return sub;
    }

    // Auto-activate only if user has never had a subscription record created and has an approved student verification application
    const user = await this.prisma.queryOne<{ email: string }>(
      `SELECT email FROM "user" WHERE id = $1`,
      [userId],
    );
    if (user?.email) {
      const appRow = await this.prisma.queryOne<{ value: any }>(
        `SELECT value FROM site_setting WHERE key = 'student_applications' LIMIT 1`,
      );
      if (appRow?.value && Array.isArray(appRow.value)) {
        const isApprovedStudent = appRow.value.some(
          (app: any) =>
            app.status === 'APPROVED' &&
            app.email &&
            app.email.trim().toLowerCase() === user.email.trim().toLowerCase(),
        );
        if (isApprovedStudent) {
          this.logger.log(`[SubscriptionService] Auto-activating approved student pass for userId=${userId} (${user.email})`);
          return this.activateStudent(userId);
        }
      }
    }

    return null;
  }

  async isActive(userId: string): Promise<boolean> {
    const row = await this.prisma.queryOne<{ active: boolean }>(
      `SELECT (status = 'ACTIVE' AND "endDate" > now()) AS active
       FROM subscription WHERE "userId" = $1`,
      [userId],
    );
    return row?.active === true;
  }

  /** Activate (or extend) a paid 6-month subscription */
  async activate(userId: string, txnId: string): Promise<SubscriptionRow | null> {
    const sub = await this.prisma.queryOne<SubscriptionRow>(
      `INSERT INTO subscription (id, "userId", "planType", status, "startDate", "endDate", "isStudent", "txnId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'SIX_MONTH', 'ACTIVE', now(), now() + interval '6 months', false, $2, now(), now())
       ON CONFLICT ("userId") DO UPDATE
         SET status      = 'ACTIVE',
             "startDate" = now(),
             "endDate"   = now() + interval '6 months',
             "txnId"     = EXCLUDED."txnId",
             "isStudent" = false,
             "updatedAt" = now()
       RETURNING *`,
      [userId, txnId],
    );

    if (sub) {
      const user = await this.prisma.queryOne<{ email: string; name: string | null }>(
        `SELECT email, name FROM "user" WHERE id = $1`,
        [userId],
      );
      if (user?.email) {
        this.sendSubscriptionGrantedEmail({
          email: user.email,
          userName: user.name || undefined,
          durationMonths: 6,
          endDate: new Date(sub.endDate),
          isStudent: false,
          note: `Payment reference: ${txnId}`,
        }).catch((err) => {
          this.logger.error(`Failed to send subscription confirmation email: ${err.message}`);
        });
      }

      // Dispatch in-app notification to user
      try {
        await this.notificationsService.notifySubscriptionGranted(userId, 6, false, sub.endDate);
      } catch (notifErr: any) {
        this.logger.warn(`Failed to dispatch in-app notification: ${notifErr.message}`);
      }
    }

    return sub;
  }

  /** Grant free 6-month subscription to an approved student */
  async activateStudent(userId: string): Promise<SubscriptionRow | null> {
    const sub = await this.prisma.queryOne<SubscriptionRow>(
      `INSERT INTO subscription (id, "userId", "planType", status, "startDate", "endDate", "isStudent", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'SIX_MONTH', 'ACTIVE', now(), now() + interval '6 months', true, now(), now())
       ON CONFLICT ("userId") DO UPDATE
         SET status      = 'ACTIVE',
             "startDate" = now(),
             "endDate"   = now() + interval '6 months',
             "isStudent" = true,
             "updatedAt" = now()
       RETURNING *`,
      [userId],
    );

    if (sub) {
      try {
        await this.notificationsService.notifySubscriptionGranted(userId, 6, true, sub.endDate);
      } catch (notifErr: any) {
        this.logger.warn(`Failed to dispatch student in-app notification: ${notifErr.message}`);
      }
    }

    return sub;
  }

  /** Returns subscription status fields suitable for embedding in auth response */
  async getStatusForUser(userId: string): Promise<{
    subscriptionStatus: 'ACTIVE' | 'EXPIRED' | null;
    subscriptionEndDate: string | null;
    isStudent: boolean;
  }> {
    const row = await this.prisma.queryOne<{
      status: string;
      endDate: Date;
      isStudent: boolean;
    }>(
      `SELECT status, "endDate", "isStudent" FROM subscription WHERE "userId" = $1`,
      [userId],
    );
    if (!row) {
      return { subscriptionStatus: null, subscriptionEndDate: null, isStudent: false };
    }
    const isActive = row.status === 'ACTIVE' && new Date(row.endDate) > new Date();
    return {
      subscriptionStatus: isActive ? 'ACTIVE' : 'EXPIRED',
      subscriptionEndDate: isActive ? new Date(row.endDate).toISOString() : null,
      isStudent: Boolean(isActive && row.isStudent),
    };
  }

  // Story Free-Read Tracking (logged-in users)

  async getReadSecs(userId: string, storyId: string): Promise<number> {
    const row = await this.prisma.queryOne<{ readSecs: number }>(
      `SELECT "readSecs" FROM story_free_read WHERE "userId" = $1 AND "storyId" = $2`,
      [userId, storyId],
    );
    return row?.readSecs ?? 0;
  }

  async hasHitPaywall(userId: string, storyId: string): Promise<boolean> {
    const row = await this.prisma.queryOne<{ paywallHit: boolean }>(
      `SELECT "paywallHit" FROM story_free_read WHERE "userId" = $1 AND "storyId" = $2`,
      [userId, storyId],
    );
    return row?.paywallHit === true;
  }

  async upsertReadSecs(
    userId: string,
    storyId: string,
    readSecs: number,
    hitPaywall: boolean,
  ): Promise<{ paywallHit: boolean }> {
    const row = await this.prisma.queryOne<{ paywallHit: boolean }>(
      `INSERT INTO story_free_read (id, "userId", "storyId", "readSecs", "paywallHit", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, now())
       ON CONFLICT ("userId", "storyId") DO UPDATE
         SET "readSecs"   = GREATEST(story_free_read."readSecs", $3),
             "paywallHit" = (story_free_read."paywallHit" OR $4),
             "updatedAt"  = now()
       RETURNING "paywallHit"`,
      [userId, storyId, readSecs, hitPaywall],
    );
    return { paywallHit: row?.paywallHit === true };
  }

  // ── Editorial Subscription Management ─────────────────────────────────────

  async getEditorialStats() {
    const stats = await this.prisma.queryOne<{
      total: string;
      active: string;
      paid: string;
      student: string;
      cancelled: string;
      expired: string;
    }>(`
      SELECT
        COUNT(*)::int as total,
        COUNT(CASE WHEN status = 'ACTIVE' AND "endDate" > now() THEN 1 END)::int as active,
        COUNT(CASE WHEN status = 'ACTIVE' AND "endDate" > now() AND "isStudent" = false THEN 1 END)::int as paid,
        COUNT(CASE WHEN status = 'ACTIVE' AND "endDate" > now() AND "isStudent" = true THEN 1 END)::int as student,
        COUNT(CASE WHEN status = 'CANCELLED' THEN 1 END)::int as cancelled,
        COUNT(CASE WHEN status = 'EXPIRED' OR (status != 'CANCELLED' AND "endDate" <= now()) THEN 1 END)::int as expired
      FROM subscription
    `);
    const paidCount = parseInt(stats?.paid ?? '0', 10);
    return {
      total: parseInt(stats?.total ?? '0', 10),
      active: parseInt(stats?.active ?? '0', 10),
      paid: paidCount,
      student: parseInt(stats?.student ?? '0', 10),
      cancelled: parseInt(stats?.cancelled ?? '0', 10),
      expired: parseInt(stats?.expired ?? '0', 10),
      estimatedRevenue: paidCount * 1,
    };
  }

  async findAllEditorial(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    type?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, Math.min(5000, options.limit || 10));
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];

    if (options.search && options.search.trim()) {
      params.push(`%${options.search.trim()}%`);
      const pIdx = params.length;
      conditions.push(`(u.email ILIKE $${pIdx} OR u.name ILIKE $${pIdx} OR s."txnId" ILIKE $${pIdx})`);
    }

    if (options.status === 'ACTIVE') {
      conditions.push(`s.status = 'ACTIVE' AND s."endDate" > now()`);
    } else if (options.status === 'EXPIRED') {
      conditions.push(`(s.status = 'EXPIRED' OR (s."endDate" <= now() AND s.status != 'CANCELLED'))`);
    } else if (options.status === 'CANCELLED') {
      conditions.push(`s.status = 'CANCELLED'`);
    }

    if (options.type === 'PAID') {
      conditions.push(`s."isStudent" = false`);
    } else if (options.type === 'STUDENT') {
      conditions.push(`s."isStudent" = true`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*)::int as count FROM subscription s JOIN "user" u ON s."userId" = u.id ${whereClause}`,
      params,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const dataParams = [...params, limit, offset];
    const limitParamIdx = params.length + 1;
    const offsetParamIdx = params.length + 2;

    const items = await this.prisma.query<any>(
      `SELECT
         s.id,
         s."userId",
         s."planType",
         s.status,
         s."startDate",
         s."endDate",
         s."isStudent",
         s."txnId",
         s."createdAt",
         s."updatedAt",
         (s.status = 'ACTIVE' AND s."endDate" > now()) as "isActive",
         u.name as "userName",
         u.email as "userEmail",
         u."avatarUrl" as "userAvatarUrl",
         u.role as "userRole"
       FROM subscription s
       JOIN "user" u ON s."userId" = u.id
       ${whereClause}
       ORDER BY s."updatedAt" DESC
       LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      dataParams,
    );

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async grantSubscription(
    emailOrUserId: string,
    durationMonths: number = 6,
    isStudent: boolean = false,
    note?: string,
  ): Promise<SubscriptionRow | null> {
    const cleanIdentifier = emailOrUserId.trim();
    let user = await this.prisma.queryOne<{ id: string; email: string; name: string | null }>(
      `SELECT id, email, name FROM "user" WHERE id = $1 OR LOWER(email) = LOWER($1)`,
      [cleanIdentifier],
    );

    // If user does not exist yet, prepare their reader profile so the subscription is attached
    if (!user) {
      user = await this.prisma.queryOne<{ id: string; email: string; name: string | null }>(
        `INSERT INTO "user" (id, email, role, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, LOWER($1), 'READER', now(), now())
         ON CONFLICT (email) DO UPDATE SET "updatedAt" = now()
         RETURNING id, email, name`,
        [cleanIdentifier],
      );
    }

    if (!user) {
      throw new Error(`Could not find or create a user account for "${emailOrUserId}"`);
    }

    const txnId = note?.trim() || (isStudent ? 'STUDENT_EDITORIAL_GRANT' : 'EDITORIAL_MANUAL_GRANT');
    const months = Math.max(1, durationMonths);

    const sub = await this.prisma.queryOne<SubscriptionRow>(
      `INSERT INTO subscription (id, "userId", "planType", status, "startDate", "endDate", "isStudent", "txnId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'SIX_MONTH', 'ACTIVE', now(), now() + ($2 || ' months')::interval, $3, $4, now(), now())
       ON CONFLICT ("userId") DO UPDATE
         SET status      = 'ACTIVE',
             "startDate" = now(),
             "endDate"   = now() + ($2 || ' months')::interval,
             "isStudent" = $3,
             "txnId"     = $4,
             "updatedAt" = now()
       RETURNING *`,
      [user.id, String(months), isStudent, txnId],
    );

    // If student pass, also update site_setting student_applications so it shows APPROVED
    if (isStudent && user.email) {
      const cleanEmail = user.email.trim().toLowerCase();
      const appRow = await this.prisma.queryOne<{ value: any }>(
        `SELECT value FROM site_setting WHERE key = 'student_applications' LIMIT 1`,
      );
      let list: any[] = [];
      if (appRow?.value) {
        list = typeof appRow.value === 'string' ? JSON.parse(appRow.value) : appRow.value;
      }
      if (!Array.isArray(list)) list = [];

      let found = false;
      const updatedList = list.map((app: any) => {
        if (app.email && app.email.trim().toLowerCase() === cleanEmail) {
          found = true;
          return {
            ...app,
            status: 'APPROVED',
            reviewNotes: note?.trim() || 'Complimentary scholar pass active (editorial desk)',
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Akam Editorial Board',
          };
        }
        return app;
      });

      if (!found) {
        const refId = `AKAM-STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        updatedList.unshift({
          id: refId,
          referenceId: refId,
          fullName: user.name || cleanEmail.split('@')[0],
          institution: 'Verified Scholar / Student Member',
          email: cleanEmail,
          idCardUrl: '/images/home/aboutDigital.png',
          submittedAt: new Date().toISOString(),
          status: 'APPROVED',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Akam Editorial Board',
          reviewNotes: note?.trim() || 'Complimentary scholar pass active (editorial desk)',
        });
      }

      await this.prisma.execute(
        `INSERT INTO site_setting (key, value, "updatedAt")
         VALUES ('student_applications', $1::jsonb, now())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, "updatedAt" = now()`,
        [JSON.stringify(updatedList)],
      );
      this.logger.log(`[SubscriptionService] Synchronized grant to student_applications for ${cleanEmail}`);
    }

    // Send standard branded confirmation email to the recipient
    if (sub && user.email) {
      this.sendSubscriptionGrantedEmail({
        email: user.email,
        userName: user.name || undefined,
        durationMonths: months,
        endDate: new Date(sub.endDate),
        isStudent,
        note,
      }).catch((err) => {
        this.logger.error(`Failed to send subscription granted email to ${user?.email}: ${err.message}`);
      });
    }

    // Send in-app notification to the user
    if (sub && user.id) {
      try {
        await this.notificationsService.notifySubscriptionGranted(user.id, months, isStudent, sub.endDate);
      } catch (notifErr: any) {
        this.logger.warn(`Failed to dispatch in-app notification to user: ${notifErr.message}`);
      }
    }

    return sub;
  }

  async cancelSubscription(id: string): Promise<boolean> {
    const row = await this.prisma.queryOne<{ userId: string; email: string; name: string | null; isStudent: boolean }>(
      `SELECT s."userId", s."isStudent", u.email, u.name
       FROM subscription s
       JOIN "user" u ON s."userId" = u.id
       WHERE s.id = $1 OR s."userId" = $1`,
      [id],
    );

    await this.prisma.execute(
      `UPDATE subscription SET status = 'CANCELLED', "updatedAt" = now() WHERE id = $1 OR "userId" = $1`,
      [id],
    );

    // Send in-app notification to user
    if (row?.userId) {
      try {
        await this.notificationsService.notifySubscriptionCancelled(row.userId);
      } catch (notifErr: any) {
        this.logger.warn(`Failed to dispatch subscription cancelled notification: ${notifErr.message}`);
      }
    }

    // Also synchronize cancellation to student_applications in site_setting
    if (row?.email) {
      const cleanEmail = row.email.trim().toLowerCase();
      const appRow = await this.prisma.queryOne<{ value: any }>(
        `SELECT value FROM site_setting WHERE key = 'student_applications' LIMIT 1`,
      );
      let list: any[] = [];
      if (appRow?.value) {
        list = typeof appRow.value === 'string' ? JSON.parse(appRow.value) : appRow.value;
      }
      if (!Array.isArray(list)) list = [];

      let found = false;
      const updatedList = list.map((app: any) => {
        if (app.email && app.email.trim().toLowerCase() === cleanEmail) {
          found = true;
          return {
            ...app,
            status: 'REJECTED',
            reviewNotes: 'Scholar pass cancelled / revoked by editorial desk',
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Akam Editorial Board',
          };
        }
        return app;
      });

      // If this subscription was a student pass and there wasn't a prior record in student_applications,
      // create a revoked/rejected record so it visibly shows as revoked in Student Verifications
      if (!found && row.isStudent) {
        const refId = `AKAM-STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        updatedList.unshift({
          id: refId,
          referenceId: refId,
          fullName: row.name || cleanEmail.split('@')[0],
          institution: 'Verified Scholar / Student Member',
          email: cleanEmail,
          idCardUrl: '/images/home/aboutDigital.png',
          submittedAt: new Date().toISOString(),
          status: 'REJECTED',
          reviewedAt: new Date().toISOString(),
          reviewedBy: 'Akam Editorial Board',
          reviewNotes: 'Scholar pass cancelled / revoked by editorial desk',
        });
      }

      await this.prisma.execute(
        `INSERT INTO site_setting (key, value, "updatedAt")
         VALUES ('student_applications', $1::jsonb, now())
         ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, "updatedAt" = now()`,
        [JSON.stringify(updatedList)],
      );
      this.logger.log(`[SubscriptionService] Synchronized cancellation to student_applications for ${cleanEmail}`);
    }

    return true;
  }

  // ─── Standard Subscription Email Delivery (Using AKAM Brand Palette) ───────────────

  async sendSubscriptionGrantedEmail(params: {
    email: string;
    userName?: string;
    durationMonths: number;
    endDate: Date;
    isStudent: boolean;
    note?: string;
  }): Promise<boolean> {
    const email = params.email?.toLowerCase().trim();
    if (!email || !email.includes('@')) {
      this.logger.warn(`Cannot send subscription granted email: invalid email "${params.email}"`);
      return false;
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';

    const { subject, html } = this.buildSubscriptionEmailTemplate(params, frontendUrl);

    return this.mailService.sendMail({
      to: email,
      subject,
      html,
      fromName: 'AKAM Digital Editorial Desk',
    });
  }

  private buildSubscriptionEmailTemplate(
    params: {
      email: string;
      userName?: string;
      durationMonths: number;
      endDate: Date;
      isStudent: boolean;
      note?: string;
    },
    frontendUrl: string,
  ): { subject: string; html: string } {
    const isStudent = params.isStudent;
    const recipientName = params.userName || params.email.split('@')[0];
    const planTitle = isStudent
      ? `${params.durationMonths}-Month Complimentary Scholar Pass`
      : `${params.durationMonths}-Month Full Access Subscription`;

    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(params.endDate);

    const subject = isStudent
      ? `🎓 Welcome to AKAM Digital: Your Scholar Pass is Active!`
      : `✨ Welcome to AKAM Digital: Your ${params.durationMonths}-Month Subscription is Active!`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isStudent ? 'Scholar Pass Active' : 'Subscription Active'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased; color: #040706;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          
          <!-- Top Brand Header with Navbar Logo -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 24px 32px; text-align: center; border-bottom: 1px solid #F1F5F9;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="https://akamdigital.in/images/akamdigital.png" alt="AKAM Digital Logo" style="height: 48px; width: auto; max-width: 230px; display: block; border: 0;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gradient Ribbon -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="padding: 36px 32px 20px 32px; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; background-color: #ECFDF5; border: 2px solid #21B573; font-size: 30px; text-align: center; margin-bottom: 16px;">
                ${isStudent ? '🎓' : '🌟'}
              </div>
              <div style="margin-bottom: 10px;">
                <span style="display: inline-block; background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 4px 14px; border-radius: 9999px;">
                  ${isStudent ? 'Scholar Access Active' : 'All-Access Active'}
                </span>
              </div>
              <h2 style="color: #040706; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
                ${isStudent ? 'Scholar Pass Granted!' : 'Subscription Granted!'}
              </h2>
              <p style="color: #475569; font-size: 14px; margin: 0 auto; max-width: 480px; line-height: 1.6;">
                Dear <strong style="color: #040706;">${recipientName}</strong>, your digital reading pass has been granted by the AKAM Digital editorial desk. You have full, unlimited access to our complete literary catalog.
              </p>
            </td>
          </tr>

          ${params.note
        ? `<!-- Editorial Note Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-left: 4px solid #21B573; border-radius: 14px; padding: 18px 20px;">
                <div style="font-size: 11px; font-weight: 700; color: #15803D; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
                  MESSAGE FROM EDITORIAL DESK
                </div>
                <p style="font-size: 13px; color: #166534; margin: 0; line-height: 1.6; font-style: italic;">
                  &ldquo;${params.note}&rdquo;
                </p>
              </div>
            </td>
          </tr>`
        : ''
      }

          <!-- Details Table -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; overflow: hidden;">
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B; width: 40%;">
                    Recipient Account
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 700; color: #040706;">
                    ${params.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                    Membership Pass
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600; color: #1E293B;">
                    ${planTitle}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                    Valid Until
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 700; color: #21B573;">
                    ${formattedDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; font-size: 12px; color: #64748B;">
                    Access Status
                  </td>
                  <td style="padding: 13px 18px; font-size: 12px; font-weight: 700;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0;">
                      ✓ ACTIVE • UNLIMITED ACCESS
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 36px 32px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/library"
                       style="display: inline-block; background: linear-gradient(135deg, #21B573 0%, #0FA975 100%); color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; padding: 15px 36px; border-radius: 9999px; letter-spacing: 0.5px; box-shadow: 0 10px 25px rgba(33, 181, 115, 0.25); text-transform: uppercase;">
                      Access Digital Library & Read Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer with Privacy Policy, Terms & Automation Notice -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 26px 32px; text-align: center; font-size: 11px; color: #64748B; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
                <em>This is an automated email. Please do not reply directly to this message.</em>
              </p>
              <p style="margin: 0 0 10px 0; font-weight: 600; color: #334155;">
                AKAM Digital Editorial Desk • Kairali Books
              </p>
              <p style="margin: 0 0 10px 0;">
                <a href="${frontendUrl}/privacy-policy" style="color: #21B573; text-decoration: underline; margin: 0 8px;">Privacy Policy</a>
                •
                <a href="${frontendUrl}/terms" style="color: #21B573; text-decoration: underline; margin: 0 8px;">Terms of Service</a>
                •
                <a href="${frontendUrl}" style="color: #64748B; text-decoration: none; margin: 0 8px;">akamdigital.in</a>
              </p>
              <p style="margin: 0; font-size: 10px; color: #94A3B8;">
                © ${new Date().getFullYear()} AKAM Digital. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    return { subject, html };
  }
}
