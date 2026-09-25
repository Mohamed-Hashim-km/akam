import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import * as nodemailer from 'nodemailer';

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
  ) {}

  private getTransporter(): nodemailer.Transporter {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const secureConfig = this.configService.get<string>('SMTP_SECURE');
    const secure = secureConfig !== undefined ? secureConfig === 'true' : port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      family: 4,
    } as any);
  }

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
      estimatedRevenue: paidCount * 399,
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
    const limit = Math.max(1, Math.min(100, options.limit || 10));
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

    // 1. Try ZeptoMail HTTPS API (Port 443 — reliable across cloud host firewalls)
    const zeptoToken = this.configService.get<string>('ZEPTO_MAIL_TOKEN');
    if (zeptoToken) {
      const zeptoUrl =
        this.configService.get<string>('ZEPTO_MAIL_URL') ||
        'https://api.zeptomail.in/v1.1/email';
      try {
        const response = await fetch(zeptoUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: zeptoToken,
          },
          body: JSON.stringify({
            from: {
              address:
                this.configService.get<string>('ZEPTO_MAIL_FROM_EMAIL') ||
                'no-reply@megamind.studio',
              name:
                this.configService.get<string>('ZEPTO_MAIL_FROM_NAME') ||
                'AKAM Digital Editorial Desk',
            },
            to: [
              {
                email_address: {
                  address: email,
                  name: params.userName || email.split('@')[0],
                },
              },
            ],
            subject,
            htmlbody: html,
          }),
        });

        if (response.ok) {
          this.logger.log(
            `✅ Subscription granted email delivered to ${email} via ZeptoMail`,
          );
          return true;
        } else {
          const errBody = await response.text();
          this.logger.warn(`ZeptoMail HTTP send returned ${response.status}: ${errBody}`);
        }
      } catch (e) {
        this.logger.warn(`ZeptoMail HTTP send error: ${(e as Error).message}`);
      }
    }

    // 2. Fallback to Nodemailer SMTP
    try {
      const transporter = this.getTransporter();
      const fromAddress =
        this.configService.get<string>('SMTP_FROM') ||
        `"AKAM Digital" <${this.configService.get('SMTP_USER')}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: `"${params.userName || email.split('@')[0]}" <${email}>`,
        subject,
        html,
      });
      this.logger.log(
        `✅ Subscription granted email delivered to ${email} via SMTP. MessageId: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to send subscription granted email to ${email}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.log(`[DEV FALLBACK] Subscription granted email for ${email}: subject="${subject}"`);
      }
      return false;
    }
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
<body style="margin: 0; padding: 0; background-color: #040706; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #080D0B; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #0E1613; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5); border: 1px solid #1E2D27;">
          
          <!-- Top Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #040706 0%, #0A261C 65%, #040706 100%); padding: 36px 32px 30px 32px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: rgba(228, 249, 83, 0.12); border: 1px solid rgba(228, 249, 83, 0.35); border-radius: 9999px; padding: 5px 16px; margin-bottom: 14px;">
                      <span style="color: #E4F953; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                        ${isStudent ? 'AKAM DIGITAL • SCHOLAR ACCESS' : 'AKAM DIGITAL • ALL-ACCESS MEMBERSHIP'}
                      </span>
                    </div>
                    <h1 style="color: #FFFFFF; font-size: 28px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">
                      അകം <span style="font-weight: 300; color: #E4F953; font-size: 20px;">| AKAM</span>
                    </h1>
                    <p style="color: #9CA3AF; font-size: 11px; margin: 6px 0 0 0; letter-spacing: 0.8px; text-transform: uppercase;">
                      Malayalam Literary Journal & Digital Archive
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Gradient Ribbon -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #0FA975 0%, #E4F953 50%, #2DB76E 100%);"></td>
          </tr>

          <!-- Hero Section -->
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center;">
              <div style="display: inline-block; width: 68px; height: 68px; line-height: 68px; border-radius: 50%; background: linear-gradient(135deg, #0FA975 0%, #064E3B 100%); border: 2px solid #E4F953; font-size: 32px; text-align: center; margin-bottom: 18px; box-shadow: 0 8px 24px rgba(15, 169, 117, 0.35);">
                ${isStudent ? '🎓' : '🌟'}
              </div>
              <h2 style="color: #FFFFFF; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
                ${isStudent ? 'Scholar Pass Granted!' : 'Subscription Granted!'}
              </h2>
              <p style="color: #9CA3AF; font-size: 14px; margin: 0 auto; max-width: 480px; line-height: 1.6;">
                Dear <strong style="color: #FFFFFF;">${recipientName}</strong>, your digital reading pass has been granted by the AKAM Digital editorial desk. You have full, unlimited access to our complete literary catalog.
              </p>
            </td>
          </tr>

          ${
            params.note
              ? `<!-- Editorial Note Card -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: rgba(15, 169, 117, 0.08); border: 1px solid rgba(15, 169, 117, 0.3); border-radius: 18px; padding: 18px 20px;">
                <div style="font-size: 10px; font-weight: 800; color: #E4F953; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                  MESSAGE FROM EDITORIAL DESK
                </div>
                <p style="font-size: 13px; color: #D1FAE5; margin: 0; line-height: 1.6; font-style: italic;">
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
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #121C18; border: 1px solid #1E2D27; border-radius: 18px; overflow: hidden;">
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1E2D27; font-size: 12px; color: #6B7280; width: 40%;">
                    Recipient Account
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1E2D27; font-size: 12px; font-weight: 700; color: #FFFFFF;">
                    ${params.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1E2D27; font-size: 12px; color: #6B7280;">
                    Membership Pass
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1E2D27; font-size: 12px; font-weight: 600; color: #E5E7EB;">
                    ${planTitle}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1E2D27; font-size: 12px; color: #6B7280;">
                    Valid Until
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #1E2D27; font-size: 12px; font-weight: 700; color: #E4F953;">
                    ${formattedDate}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; font-size: 12px; color: #6B7280;">
                    Access Status
                  </td>
                  <td style="padding: 13px 18px; font-size: 12px; font-weight: 700;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; background-color: rgba(15, 169, 117, 0.2); color: #34D399; border: 1px solid #0FA975;">
                      ✓ ACTIVE • UNLIMITED ACCESS
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Seamless Access Note (No Logout Needed) -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <div style="background-color: rgba(228, 249, 83, 0.05); border: 1px dashed rgba(228, 249, 83, 0.25); border-radius: 14px; padding: 14px 18px; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #E4F953; font-weight: 600;">
                  ✨ Instant Access: No logout needed!
                </p>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #9CA3AF; line-height: 1.5;">
                  Your active pass is automatically synced with your logged-in browser session. Simply open any issue or story to enjoy uninterrupted reading.
                </p>
              </div>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${frontendUrl}/library"
                       style="display: inline-block; background: linear-gradient(135deg, #0FA975 0%, #064E3B 100%); color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; padding: 15px 36px; border-radius: 9999px; letter-spacing: 0.5px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4); text-transform: uppercase;">
                      Access Digital Library & Read Now →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #040706; padding: 26px 32px; text-align: center; border-top: 1px solid #1E2D27;">
              <p style="color: #9CA3AF; font-size: 11px; font-weight: 700; margin: 0 0 6px 0; letter-spacing: 0.5px;">
                AKAM Digital Editorial Desk • Kairali Books
              </p>
              <p style="color: #6B7280; font-size: 11px; margin: 0 0 14px 0;">
                <a href="mailto:editorial@akamdigital.com" style="color: #0FA975; text-decoration: none;">editorial@akamdigital.com</a>
                &nbsp;•&nbsp;
                <a href="${frontendUrl}" style="color: #9CA3AF; text-decoration: none;">akamdigital.com</a>
              </p>
              <p style="color: #4B5563; font-size: 10px; margin: 0;">
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
