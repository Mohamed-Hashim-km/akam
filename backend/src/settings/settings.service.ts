import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { MailService } from '../mail/mail.service.js';
import { UpdateEditorsNoteDto } from './dto/update-editors-note.dto.js';
import { GrantStudentPassDto } from './dto/create-student-application.dto.js';

export interface EditorsNoteValue {
  title: string;
  note: string;
  bgImageSrc: string;
}

const DEFAULT_NOTE: EditorsNoteValue = {
  title: "Editor's Note",
  note: "This month we celebrate the voices shaping Malayalam literature today. Read slowly, share widely, and – if you have a story of your own – write it. Every submission passes through our editorial board before it reaches you.",
  bgImageSrc: "/images/home/editorialNot.webp",
};

export interface StudentApplicationRecord {
  id: string;
  referenceId: string;
  fullName: string;
  institution: string;
  email: string;
  idCardUrl: string;
  idCardName?: string;
  submittedAt: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  endDate?: string;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private mailService: MailService,
  ) {}

  async getEditorsNote(): Promise<EditorsNoteValue> {
    const row = await this.prisma.queryOne<{ value: any }>(
      `SELECT value FROM site_setting WHERE key = 'editors_note' LIMIT 1`,
    );

    if (!row || !row.value) {
      return DEFAULT_NOTE;
    }

    const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
    return {
      title: val.title || DEFAULT_NOTE.title,
      note: val.note || DEFAULT_NOTE.note,
      bgImageSrc: val.bgImageSrc || DEFAULT_NOTE.bgImageSrc,
    };
  }

  async updateEditorsNote(dto: UpdateEditorsNoteDto): Promise<EditorsNoteValue> {
    const current = await this.getEditorsNote();
    const updated: EditorsNoteValue = {
      title: dto.title !== undefined ? dto.title : current.title,
      note: dto.note !== undefined ? dto.note : current.note,
      bgImageSrc: dto.bgImageSrc !== undefined ? dto.bgImageSrc : current.bgImageSrc,
    };

    await this.prisma.execute(
      `INSERT INTO site_setting (key, value, "updatedAt")
       VALUES ('editors_note', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, "updatedAt" = now()`,
      [JSON.stringify(updated)],
    );

    return updated;
  }

  async getStudentApplications(): Promise<StudentApplicationRecord[]> {
    const row = await this.prisma.queryOne<{ value: any }>(
      `SELECT value FROM site_setting WHERE key = 'student_applications' LIMIT 1`,
    );

    if (row && row.value !== undefined && row.value !== null) {
      const list = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
      if (Array.isArray(list)) {
        let hasLegacyFields = false;
        const cleaned = list.map((item: any) => {
          if (item.studentIdNumber !== undefined || item.course !== undefined) {
            hasLegacyFields = true;
          }
          const { studentIdNumber, course, ...clean } = item;
          return clean as StudentApplicationRecord;
        });

        if (hasLegacyFields) {
          this.prisma
            .execute(
              `UPDATE site_setting SET value = $1::jsonb, "updatedAt" = now() WHERE key = 'student_applications'`,
              [JSON.stringify(cleaned)],
            )
            .catch((e) =>
              this.logger.warn(`Could not persist cleaned student applications: ${e.message}`),
            );
        }

        // Enrich approved records with active subscription endDate if missing
        try {
          const subs = await this.prisma.query<{ email: string; endDate: string }>(
            `SELECT LOWER(u.email) as email, s."endDate"
             FROM subscription s
             JOIN "user" u ON s."userId" = u.id
             WHERE s.status = 'ACTIVE'`,
          );
          if (subs && subs.length > 0) {
            const subMap = new Map<string, string>();
            subs.forEach((s) => {
              if (s.email && s.endDate) {
                subMap.set(s.email.toLowerCase().trim(), new Date(s.endDate).toISOString());
              }
            });
            cleaned.forEach((item) => {
              if (item.status === 'APPROVED' && !item.endDate && item.email) {
                const foundEnd = subMap.get(item.email.toLowerCase().trim());
                if (foundEnd) {
                  item.endDate = foundEnd;
                }
              }
            });
          }
        } catch {
          // ignore query error
        }

        return cleaned;
      }
    }

    return [];
  }

  async getStudentApplicationsPaginated(params: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<{
    data: StudentApplicationRecord[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    stats: {
      total: number;
      pending: number;
      approved: number;
      rejected: number;
    };
  }> {
    const all = await this.getStudentApplications();

    const stats = {
      total: all.length,
      pending: all.filter((a) => a.status === 'PENDING_APPROVAL').length,
      approved: all.filter((a) => a.status === 'APPROVED').length,
      rejected: all.filter((a) => a.status === 'REJECTED').length,
    };

    let filtered = [...all];

    if (params.status && params.status !== 'ALL') {
      filtered = filtered.filter((a) => a.status === params.status);
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim().toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.fullName?.toLowerCase().includes(q) ||
          a.institution?.toLowerCase().includes(q) ||
          a.email?.toLowerCase().includes(q) ||
          a.referenceId?.toLowerCase().includes(q),
      );
    }

    // Sort newest first
    filtered.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );

    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, params.limit || 9);
    const total = filtered.length;
    const startIndex = (page - 1) * limit;
    const data = filtered.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + data.length < total;

    return {
      data,
      total,
      page,
      limit,
      hasMore,
      stats,
    };
  }

  async submitStudentApplication(dto: {
    fullName: string;
    institution: string;
    email: string;
    idCardUrl?: string;
    idCardName?: string;
    referenceId?: string;
  }): Promise<StudentApplicationRecord> {
    const list = await this.getStudentApplications();
    const refId =
      dto.referenceId ||
      `AKAM-STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const newRecord: StudentApplicationRecord = {
      id: refId,
      referenceId: refId,
      fullName: dto.fullName,
      institution: dto.institution,
      email: dto.email,
      idCardUrl: dto.idCardUrl || '',
      idCardName: dto.idCardName || '',
      submittedAt: new Date().toISOString(),
      status: 'PENDING_APPROVAL',
    };

    const existingIndex = list.findIndex(
      (item) =>
        item.referenceId === refId ||
        (item.email && dto.email && item.email.trim().toLowerCase() === dto.email.trim().toLowerCase()),
    );

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...newRecord,
        status: 'PENDING_APPROVAL',
        reviewNotes: undefined,
        reviewedBy: undefined,
        reviewedAt: undefined,
      };
    } else {
      list.unshift(newRecord);
    }

    await this.prisma.execute(
      `INSERT INTO site_setting (key, value, "updatedAt")
       VALUES ('student_applications', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, "updatedAt" = now()`,
      [JSON.stringify(list)],
    );

    // Notify all editors / admins with an in-app notification linking to the student verifications panel
    try {
      await this.notificationsService.notifyEditorsOfStudentApplication(
        dto.fullName,
        dto.institution,
        newRecord.referenceId,
      );
      this.logger.log(`[StudentApp] Notified editorial staff about application ${newRecord.referenceId} from ${dto.email}`);
    } catch (notifErr: any) {
      this.logger.warn(`Could not dispatch in-app notification to editors: ${notifErr.message}`);
    }

    // Also send an email notification to the Editorial Board email
    this.sendEditorialNewApplicationAlert(newRecord).catch((e) =>
      this.logger.warn(`Failed to send editorial new application email: ${e.message}`),
    );

    return newRecord;
  }

  async grantStudentPassDirectly(
    dto: GrantStudentPassDto,
    reviewerName?: string,
  ): Promise<StudentApplicationRecord> {
    const list = await this.getStudentApplications();
    const refId =
      dto.referenceId ||
      `AKAM-STU-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const targetEndDate =
      dto.endDate && !isNaN(new Date(dto.endDate).getTime())
        ? new Date(dto.endDate).toISOString()
        : new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();

    const newRecord: StudentApplicationRecord = {
      id: refId,
      referenceId: refId,
      fullName: dto.fullName.trim(),
      institution: dto.institution.trim(),
      email: dto.email.trim(),
      idCardUrl: dto.idCardUrl || '/images/home/aboutDigital.png',
      idCardName: dto.idCardName || 'Direct_Editorial_Grant.png',
      submittedAt: new Date().toISOString(),
      status: 'APPROVED',
      reviewedAt: new Date().toISOString(),
      reviewedBy: dto.reviewedBy || reviewerName || 'Akam Editorial Board',
      reviewNotes: dto.reviewNotes || 'Direct scholar pass granted by Akam Editorial Board.',
      endDate: targetEndDate,
    };

    const existingIndex = list.findIndex(
      (item) =>
        item.referenceId === refId ||
        (item.email && item.email.trim().toLowerCase() === dto.email.trim().toLowerCase()),
    );

    if (existingIndex >= 0) {
      list[existingIndex] = {
        ...list[existingIndex],
        ...newRecord,
      };
    } else {
      list.unshift(newRecord);
    }

    await this.prisma.execute(
      `INSERT INTO site_setting (key, value, "updatedAt")
       VALUES ('student_applications', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, "updatedAt" = now()`,
      [JSON.stringify(list)],
    );

    // Grant free student subscription to the actual student's email with specified endDate
    await this.grantStudentSubscription(newRecord.email, targetEndDate).catch((err) =>
      this.logger.error(`Failed to grant student subscription: ${err.message}`),
    );

    // Send confirmation email
    this.sendStudentStatusEmail(newRecord, 'APPROVED', newRecord.reviewNotes).catch((err) =>
      this.logger.error(`Failed to send status email to ${newRecord.email}: ${err.message}`),
    );

    this.logger.log(`[StudentApp] ✅ Editorial direct grant issued for ${newRecord.fullName} (${newRecord.email})`);
    return newRecord;
  }

  async updateStudentApplicationStatus(
    refId: string,
    status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
    reviewedBy?: string,
    endDate?: string,
  ): Promise<StudentApplicationRecord | null> {
    const list = await this.getStudentApplications();
    const index = list.findIndex((item) => item.referenceId === refId || item.id === refId);

    if (index === -1) {
      this.logger.warn(`[StudentApp] Application ${refId} not found for status update`);
      return null;
    }

    list[index].status = status;
    list[index].reviewedAt = new Date().toISOString();
    if (reviewNotes !== undefined) {
      list[index].reviewNotes = reviewNotes;
    }
    if (reviewedBy) {
      list[index].reviewedBy = reviewedBy;
    }

    let targetEndDate: string | undefined;
    if (status === 'APPROVED') {
      if (endDate && !isNaN(new Date(endDate).getTime())) {
        targetEndDate = new Date(endDate).toISOString();
      } else if (list[index].endDate) {
        targetEndDate = list[index].endDate;
      } else {
        targetEndDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
      }
      list[index].endDate = targetEndDate;
    } else {
      delete list[index].endDate;
    }

    await this.prisma.execute(
      `INSERT INTO site_setting (key, value, "updatedAt")
       VALUES ('student_applications', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, "updatedAt" = now()`,
      [JSON.stringify(list)],
    );

    const updated = list[index];

    // Trigger email notification for APPROVAL or REJECTION
    if (status === 'APPROVED' || status === 'REJECTED') {
      this.sendStudentStatusEmail(updated, status, reviewNotes).catch((err) =>
        this.logger.error(`Failed to send student status email: ${err.message}`),
      );
    }

    // Grant free student subscription when student is approved
    if (status === 'APPROVED' && updated.email) {
      this.grantStudentSubscription(updated.email, targetEndDate).catch((err) =>
        this.logger.error(`Failed to grant student subscription: ${err.message}`),
      );
    }

    // Cancel/revoke subscription when student is rejected
    if (status === 'REJECTED' && updated.email) {
      this.revokeStudentSubscription(updated.email, reviewNotes).catch((err) =>
        this.logger.error(`Failed to revoke student subscription: ${err.message}`),
      );
    }

    return updated;
  }

  /** Looks up user by email and creates/extends their free student subscription */
  private async grantStudentSubscription(email: string, customEndDate?: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    let user = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM "user" WHERE LOWER(email) = $1`,
      [cleanEmail],
    );
    if (!user) {
      user = await this.prisma.queryOne<{ id: string }>(
        `INSERT INTO "user" (id, email, role, "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'READER', now(), now())
         ON CONFLICT (email) DO UPDATE SET "updatedAt" = now()
         RETURNING id`,
        [cleanEmail],
      );
    }
    if (!user) {
      this.logger.warn(`[StudentSub] Could not ensure user record for email ${cleanEmail}`);
      return;
    }

    let targetDate: Date;
    if (customEndDate && !isNaN(new Date(customEndDate).getTime())) {
      targetDate = new Date(customEndDate);
    } else {
      targetDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    }

    await this.prisma.execute(
      `INSERT INTO subscription (id, "userId", "planType", status, "startDate", "endDate", "isStudent", "txnId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'SIX_MONTH', 'ACTIVE', now(), $2, true, 'STUDENT_EDITORIAL_GRANT', now(), now())
       ON CONFLICT ("userId") DO UPDATE
         SET status      = 'ACTIVE',
             "startDate" = now(),
             "endDate"   = $2,
             "isStudent" = true,
             "txnId"     = 'STUDENT_EDITORIAL_GRANT',
             "updatedAt" = now()`,
      [user.id, targetDate.toISOString()],
    );
    this.logger.log(`[StudentSub] ✅ Free student subscription granted to userId=${user.id} (${cleanEmail}) until ${targetDate.toISOString()}`);

    // Dispatch in-app notification
    try {
      const days = Math.round((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      const months = Math.max(1, Math.round(days / 30));
      await this.notificationsService.notifyStudentApplicationApproved(user.id, months, targetDate);
    } catch (notifErr: any) {
      this.logger.warn(`Failed to dispatch in-app notification: ${notifErr.message}`);
    }
  }

  /** Revokes active subscription and notifies a rejected student */
  private async revokeStudentSubscription(email: string, reason?: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM "user" WHERE LOWER(email) = $1`,
      [cleanEmail],
    );

    await this.prisma.execute(
      `UPDATE subscription SET status = 'CANCELLED', "updatedAt" = now()
       WHERE "userId" IN (SELECT id FROM "user" WHERE LOWER(email) = $1)`,
      [cleanEmail],
    );
    this.logger.log(`[StudentSub] 🚫 Subscription cancelled for email ${cleanEmail}`);

    if (user?.id) {
      try {
        await this.notificationsService.notifyStudentApplicationRejected(user.id, reason);
      } catch (notifErr: any) {
        this.logger.warn(`Failed to dispatch student rejection notification: ${notifErr.message}`);
      }
    }
  }

  async deleteStudentApplication(refId: string): Promise<boolean> {
    const cleanId = (refId || '').trim().toLowerCase();
    const list = await this.getStudentApplications();
    const target = list.find(
      (item) =>
        (item.referenceId || '').trim().toLowerCase() === cleanId ||
        (item.id || '').trim().toLowerCase() === cleanId,
    );
    const filtered = list.filter(
      (item) =>
        (item.referenceId || '').trim().toLowerCase() !== cleanId &&
        (item.id || '').trim().toLowerCase() !== cleanId,
    );
    await this.prisma.execute(
      `INSERT INTO site_setting (key, value, "updatedAt")
       VALUES ('student_applications', $1::jsonb, now())
       ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value, "updatedAt" = now()`,
      [JSON.stringify(filtered)],
    );
    if (target?.email) {
      await this.revokeStudentSubscription(target.email);
    }
    return true;
  }

  async getStudentApplicationStatus(identifier: string): Promise<StudentApplicationRecord | null> {
    const clean = (identifier || '').trim().toLowerCase();
    if (!clean) return null;
    const list = await this.getStudentApplications();
    return (
      list.find(
        (a) =>
          a.referenceId?.trim().toLowerCase() === clean ||
          a.id?.trim().toLowerCase() === clean ||
          a.email?.trim().toLowerCase() === clean,
      ) || null
    );
  }

  // ─── Student Status Email Delivery (Using AKAM Brand Palette) ──────────────────────────

  async sendStudentStatusEmail(
    record: StudentApplicationRecord,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes?: string,
  ): Promise<boolean> {
    const email = record.email?.toLowerCase().trim();
    if (!email || !email.includes('@')) {
      this.logger.warn(`Cannot send student verification email: invalid email address "${record.email}"`);
      return false;
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';

    const { subject, html } = this.buildStudentStatusEmailTemplate(
      record,
      status,
      reviewNotes,
      frontendUrl,
    );

    return this.mailService.sendMail({
      to: email,
      subject,
      html,
      fromName: 'AKAM Digital Editorial Desk',
    });
  }

  private buildStudentStatusEmailTemplate(
    record: StudentApplicationRecord,
    status: 'APPROVED' | 'REJECTED',
    reviewNotes: string | undefined,
    frontendUrl: string,
  ): { subject: string; html: string } {
    const isApproved = status === 'APPROVED';
    const effectiveNotes =
      reviewNotes ||
      (isApproved
        ? 'Your student credentials have been verified. You now have full, complimentary access to AKAM Digital editions and monthly literary issues.'
        : 'Uploaded identity card image does not meet our verification criteria. Please ensure your ID clearly displays your name, roll number, and valid academic year.');

    const subject = isApproved
      ? `🎓 Welcome to AKAM Digital: Your Student Scholar Pass is Approved! [${record.referenceId}]`
      : `Action Required: Update on Your Student Verification Application [${record.referenceId}]`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${isApproved ? 'Student Pass Approved' : 'Student Verification Update'}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Background Shell -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); border: 1px solid #E2E8F0;">
          
          <!-- Top Brand Header with Navbar Logo -->
          <tr>
            <td style="background-color: #FFFFFF; padding: 24px 28px; text-align: center; border-bottom: 3px solid #21B573;">
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

          <!-- Gradient Ribbon Separator -->
          <tr>
            <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
          </tr>

          <!-- Sub Header Strip -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 14px 24px; text-align: center; border-bottom: 1px solid #F1F5F9;">
              <div style="display: inline-block; background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 9999px; padding: 5px 16px;">
                <span style="color: #065F46; font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                  AKAM DIGITAL • SCHOLAR ACCESS
                </span>
              </div>
            </td>
          </tr>

          <!-- Hero Decision Section -->
          <tr>
            <td style="padding: 36px 32px 24px 32px; text-align: center;">
              ${
                isApproved
                  ? `
                <!-- APPROVED ICON & TITLE -->
                <div style="display: inline-block; width: 68px; height: 68px; line-height: 68px; border-radius: 50%; background: #ECFDF5; border: 2px solid #21B573; font-size: 32px; text-align: center; margin-bottom: 18px;">
                  🎓
                </div>
                <h2 style="color: #040706; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
                  Verification Approved!
                </h2>
                <p style="color: #475569; font-size: 14px; margin: 0 auto; max-width: 460px; line-height: 1.6;">
                  Dear <strong style="color: #040706;">${record.fullName}</strong>, congratulations! Your student credentials have been verified by the editorial board. Your <strong style="color: #21B573;">100% Free Scholar Pass</strong> is now active.
                </p>
              `
                  : `
                <!-- REJECTED ICON & TITLE -->
                <div style="display: inline-block; width: 68px; height: 68px; line-height: 68px; border-radius: 50%; background: #FFF1F2; border: 2px solid #F43F5E; font-size: 30px; text-align: center; margin-bottom: 18px;">
                  📋
                </div>
                <h2 style="color: #040706; font-size: 24px; font-weight: 800; margin: 0 0 10px 0; letter-spacing: -0.5px;">
                  Verification Status Update
                </h2>
                <p style="color: #475569; font-size: 14px; margin: 0 auto; max-width: 460px; line-height: 1.6;">
                  Dear <strong style="color: #040706;">${record.fullName}</strong>, thank you for your interest in AKAM Digital. After editorial review, your student identity verification could not be approved at this stage.
                </p>
              `
              }
            </td>
          </tr>

          <!-- Editorial Feedback Note Card -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <div style="background-color: ${isApproved ? '#F0FDF4' : '#FFF1F2'}; border: 1px solid ${isApproved ? '#BBF7D0' : '#FECDD3'}; border-radius: 16px; padding: 20px 22px;">
                <div style="font-size: 10px; font-weight: 800; color: ${isApproved ? '#166534' : '#9F1239'}; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">
                  ${isApproved ? 'EDITORIAL BOARD WELCOME NOTE' : 'REASON & EDITORIAL GUIDANCE'}
                </div>
                <p style="font-size: 13px; color: ${isApproved ? '#15803D' : '#BE123C'}; margin: 0; line-height: 1.6; font-style: italic;">
                  &ldquo;${effectiveNotes}&rdquo;
                </p>
                ${
                  !isApproved
                    ? `<p style="font-size: 11px; color: #64748B; margin: 10px 0 0 0; line-height: 1.5;">
                        💡 <strong>How to fix:</strong> You can submit a fresh, legible photo or scan of your valid student identity card by visiting our subscription plans page.
                      </p>`
                    : ''
                }
              </div>
            </td>
          </tr>

          <!-- Application Details Table -->
          <tr>
            <td style="padding: 0 32px 28px 32px;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden;">
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B; width: 40%;">
                    Applicant Name
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 700; color: #040706;">
                    ${record.fullName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                    College / Institution
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #334155;">
                    ${record.institution}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                    Email
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 600; color: #334155;">
                    ${record.email}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                    Application Reference
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 700; color: #21B573; font-family: monospace;">
                    ${record.referenceId || record.id}
                  </td>
                </tr>
                ${
                  isApproved && record.endDate
                    ? `<tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                    Pass Duration
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 700; color: #040706;">
                    ${Math.max(1, Math.round(Math.max(1, (new Date(record.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) / 30))} Months
                  </td>
                </tr>
                <tr>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; color: #64748B;">
                    Access Valid Until
                  </td>
                  <td style="padding: 13px 18px; border-bottom: 1px solid #E2E8F0; font-size: 12px; font-weight: 700; color: #21B573;">
                    ${new Date(record.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>`
                    : ''
                }
                <tr>
                  <td style="padding: 13px 18px; font-size: 12px; color: #64748B;">
                    Current Status
                  </td>
                  <td style="padding: 13px 18px; font-size: 12px; font-weight: 700;">
                    <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; ${
                      isApproved
                        ? 'background-color: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0;'
                        : 'background-color: #FFF1F2; color: #9F1239; border: 1px solid #FECDD3;'
                    }">
                      ${isApproved ? '✓ APPROVED • 100% FREE SCHOLAR PASS' : '✕ REJECTED • RESUBMISSION WELCOME'}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${isApproved ? `${frontendUrl}/library` : `${frontendUrl}/plans`}"
                       style="display: inline-block; background-color: #21B573; color: #FFFFFF; font-size: 13px; font-weight: 800; text-decoration: none; padding: 15px 36px; border-radius: 9999px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(33, 181, 115, 0.25); text-transform: uppercase;">
                      ${isApproved ? 'Access Digital Library & Read Now →' : 'Resubmit ID Card Verification →'}
                    </a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 12px; color: #64748B; margin: 16px 0 0 0; line-height: 1.5;">
                ${
                  isApproved
                    ? `Log in using your registered email to immediately access all digital issues. You can view your pass details anytime at <a href="${frontendUrl}/profile" style="color: #21B573; text-decoration: underline;">${frontendUrl}/profile</a>.`
                    : 'Need assistance? You can reach our editorial desk at <a href="mailto:editorial@akamdigital.in" style="color: #21B573; text-decoration: underline;">editorial@akamdigital.in</a>.'
                }
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 26px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="color: #64748B; font-size: 11px; margin: 0 0 10px 0; font-weight: 500;">
                <em>This is an automated email. Please do not reply directly to this message.</em>
              </p>
              <p style="color: #475569; font-size: 11px; font-weight: 700; margin: 0 0 8px 0; letter-spacing: 0.5px;">
                AKAM Digital Editorial Desk • Kairali Books
              </p>
              <p style="color: #64748B; font-size: 11px; margin: 0 0 12px 0;">
                <a href="${frontendUrl}/privacy-policy" style="color: #21B573; text-decoration: none; font-weight: 600;">Privacy Policy</a>
                &nbsp;•&nbsp;
                <a href="${frontendUrl}/terms" style="color: #21B573; text-decoration: none; font-weight: 600;">Terms of Service</a>
                &nbsp;•&nbsp;
                <a href="${frontendUrl}" style="color: #64748B; text-decoration: none;">akamdigital.in</a>
              </p>
              <p style="color: #94A3B8; font-size: 10px; margin: 0;">
                © ${new Date().getFullYear()} AKAM Digital. All rights reserved. Registered literature scholarship program.
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

  private async sendEditorialNewApplicationAlert(
    record: StudentApplicationRecord,
  ): Promise<void> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';
    const reviewUrl = `${frontendUrl}/editorial?tab=subscriptions&subTab=verifications&page=1`;
    const editorialEmail =
      this.configService.get<string>('SMTP_USER') || 'editorial@akamdigital.com';

    const subject = `[New Student Pass Application] ${record.fullName} (${record.institution})`;
    const logoUrl = 'https://akamdigital.in/images/akamdigital.png';
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Student Scholar Pass Application</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 36px 16px;">
          <tr>
            <td align="center">
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);">
                
                <!-- Navbar Logo Header -->
                <tr>
                  <td style="background-color: #FFFFFF; padding: 22px 28px; text-align: left; border-bottom: 3px solid #21B573;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <a href="${frontendUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                            <img src="${logoUrl}" alt="AKAM Digital" style="height: 44px; width: auto; max-width: 220px; display: block; border: 0;" />
                          </a>
                        </td>
                        <td align="right">
                          <span style="background-color: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; font-size: 10px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; letter-spacing: 1px; text-transform: uppercase;">
                            EDITORIAL DESK
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Gradient Ribbon -->
                <tr>
                  <td height="4" style="background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%);"></td>
                </tr>

                <!-- Content Area -->
                <tr>
                  <td style="padding: 32px;">
                    <h2 style="color: #040706; margin: 0 0 10px; font-size: 20px; font-weight: 800; letter-spacing: -0.3px;">
                      New Student Scholar Pass Application
                    </h2>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 22px 0;">
                      A student has submitted their credentials for a 100% Free Scholar Pass. Please review their submitted identity card in the editorial management panel.
                    </p>

                    <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px; padding: 20px; margin-bottom: 24px; font-size: 13px;">
                      <table width="100%" border="0" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding: 8px 0; color: #64748B; font-weight: 700; width: 35%;">Applicant:</td>
                          <td style="padding: 8px 0; color: #040706; font-weight: 600;">${record.fullName}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748B; font-weight: 700;">Institution:</td>
                          <td style="padding: 8px 0; color: #334155;">${record.institution}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748B; font-weight: 700;">Email:</td>
                          <td style="padding: 8px 0; color: #334155;">${record.email}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; color: #64748B; font-weight: 700;">Reference ID:</td>
                          <td style="padding: 8px 0; color: #21B573; font-family: monospace; font-weight: 700;">${record.referenceId}</td>
                        </tr>
                      </table>
                    </div>

                    <div style="text-align: center; margin-top: 24px;">
                      <a href="${reviewUrl}" style="display: inline-block; background-color: #21B573; color: #FFFFFF; text-decoration: none; padding: 14px 34px; font-weight: 800; border-radius: 9999px; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 4px 12px rgba(33, 181, 115, 0.25);">
                        Open Student Verifications Panel →
                      </a>
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 22px 32px; text-align: center;">
                    <p style="color: #64748B; font-size: 11px; margin: 0 0 8px 0;">
                      <em>This is an automated email. Please do not reply directly to this message.</em>
                    </p>
                    <p style="color: #64748B; font-size: 11px; margin: 0 0 10px 0;">
                      <a href="${frontendUrl}/privacy-policy" style="color: #21B573; text-decoration: none; font-weight: 600;">Privacy Policy</a>
                      &nbsp;•&nbsp;
                      <a href="${frontendUrl}/terms" style="color: #21B573; text-decoration: none; font-weight: 600;">Terms of Service</a>
                      &nbsp;•&nbsp;
                      <a href="${frontendUrl}" style="color: #64748B; text-decoration: none;">akamdigital.in</a>
                    </p>
                    <p style="color: #94A3B8; font-size: 10px; margin: 0;">
                      AKAM Digital Scholar Verification System • Internal Editorial Notice
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await this.mailService.sendMail({
      to: editorialEmail,
      subject,
      html,
      fromName: 'AKAM Scholar Portal',
    });
  }
}

