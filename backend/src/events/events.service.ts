import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { PayUService } from '../subscription/payu.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
import { RegisterEventDto } from './dto/register-event.dto.js';
import { EventType } from './events.types.js';

export interface EventItem {
  id: string;
  type: EventType;
  title: string;
  description: string;
  location: string;
  time: string | null;
  day: string | null;
  monthYear: string | null;
  eventDate: Date | null;
  imageSrc: string | null;
  images?: string[];
  videoUrl: string | null;
  registerHref: string | null;
  isPublished: boolean;
  isPaid: boolean;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const SELECT_FIELDS = `id, type, title, description, location, time, day, "monthYear", "eventDate", "imageSrc", images, "videoUrl", "registerHref", "isPublished", "isPaid", price::float as price, "createdAt", "updatedAt"`;

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly pendingEventRegistrations = new Map<
    string,
    {
      id: string;
      eventId: string;
      userId?: string;
      name: string;
      email: string;
      phone?: string;
      notes?: string;
      amount: number;
      createdAt: number;
    }
  >();

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly payUService: PayUService,
    private readonly configService: ConfigService,
  ) {}

  // ── Public Endpoints ─────────────────────────────────────────────────────
  async findAllPublished(type?: EventType): Promise<EventItem[]> {
    const orderClause = type === EventType.PAST_ARCHIVE
      ? `ORDER BY "createdAt" DESC`
      : `ORDER BY CASE WHEN "eventDate" IS NOT NULL THEN "eventDate" ELSE '9999-12-31'::timestamp END ASC, "createdAt" DESC`;

    if (type) {
      return this.prisma.query<EventItem>(
        `SELECT ${SELECT_FIELDS}
         FROM "event"
         WHERE "isPublished" = true AND type::text = $1
         ${orderClause}`,
        [type]
      );
    }
    return this.prisma.query<EventItem>(
      `SELECT ${SELECT_FIELDS}
       FROM "event"
       WHERE "isPublished" = true
       ${orderClause}`
    );
  }

  async findPublishedPaginated(
    type?: EventType,
    page: number = 1,
    limit: number = 6,
    upcomingOnly: boolean = true,
  ) {
    const offset = (page - 1) * limit;
    const whereConditions: string[] = ['"isPublished" = true'];
    const params: any[] = [];

    if (type) {
      params.push(type);
      whereConditions.push(`type::text = $${params.length}`);
    }

    if (upcomingOnly && type !== EventType.PAST_ARCHIVE) {
      whereConditions.push(`type::text != 'PAST_ARCHIVE'`);
      whereConditions.push(`("eventDate" IS NULL OR "eventDate" >= CURRENT_DATE)`);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    const countRow = await this.prisma.queryOne<{ total: string }>(
      `SELECT COUNT(*)::int as total
       FROM "event"
       ${whereClause}`,
      params
    );
    const total = parseInt(countRow?.total ?? '0', 10);

    const dataParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const orderByClause = (upcomingOnly && type !== EventType.PAST_ARCHIVE)
      ? `ORDER BY CASE WHEN "eventDate" IS NOT NULL THEN "eventDate" ELSE '9999-12-31'::timestamp END ASC, "createdAt" DESC`
      : `ORDER BY "createdAt" DESC`;

    const data = await this.prisma.query<EventItem>(
      `SELECT ${SELECT_FIELDS}
       FROM "event"
       ${whereClause}
       ${orderByClause}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      dataParams
    );

    const hasMore = offset + data.length < total;
    return {
      data,
      meta: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findPastArchivesPaginated(page: number = 1, limit: number = 6) {
    const offset = (page - 1) * limit;

    const countRow = await this.prisma.queryOne<{ total: string }>(
      `SELECT COUNT(*)::int as total
       FROM "event"
       WHERE "isPublished" = true
         AND type::text = 'PAST_ARCHIVE'`
    );
    const total = parseInt(countRow?.total ?? '0', 10);

    const data = await this.prisma.query<EventItem>(
      `SELECT ${SELECT_FIELDS}
       FROM "event"
       WHERE "isPublished" = true
         AND type::text = 'PAST_ARCHIVE'
       ORDER BY "createdAt" DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const hasMore = offset + data.length < total;
    return {
      data,
      meta: {
        page,
        limit,
        total,
        hasMore,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<EventItem> {
    const row = await this.prisma.queryOne<EventItem>(
      `SELECT ${SELECT_FIELDS}
       FROM "event"
       WHERE id = $1`,
      [id]
    );
    if (!row) throw new NotFoundException('Event not found');
    return row;
  }

  // ── Editorial Endpoints ──────────────────────────────────────────────────
  async findAllEditorial(type?: EventType): Promise<EventItem[]> {
    if (type) {
      return this.prisma.query<EventItem>(
        `SELECT ${SELECT_FIELDS}
         FROM "event"
         WHERE type::text = $1
         ORDER BY "createdAt" DESC`,
        [type]
      );
    }
    return this.prisma.query<EventItem>(
      `SELECT ${SELECT_FIELDS}
       FROM "event"
       ORDER BY "createdAt" DESC`
    );
  }

  async findAllEditorialPaginated(
    page: number = 1,
    limit: number = 10,
    type?: string,
    search?: string
  ) {
    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (type && type !== 'ALL') {
      params.push(type);
      whereConditions.push(`e.type::text = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereConditions.push(`(e.title ILIKE $${params.length} OR e.description ILIKE $${params.length} OR e.location ILIKE $${params.length} OR e.type::text ILIKE $${params.length} OR e."monthYear" ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int as total FROM "event" e ${whereClause}`;
    const countRes = await this.prisma.queryOne<{ total: number }>(countSql, params);
    const total = countRes?.total || 0;

    const dataParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataSql = `
      SELECT 
        e.id, e.type, e.title, e.description, e.location, e.time, e.day, e."monthYear", e."eventDate", e."imageSrc", e.images, e."videoUrl", e."registerHref", e."isPublished", e."isPaid", e.price::float as price, e."createdAt", e."updatedAt",
        COALESCE((SELECT COUNT(*)::int FROM "event_registration" er WHERE er."eventId" = e.id), 0) AS "registrationCount"
      FROM "event" e
      ${whereClause}
      ORDER BY e."createdAt" DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const data = await this.prisma.query<EventItem & { registrationCount: number }>(dataSql, dataParams);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
      const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
      const secureConfig = this.configService.get<string>('SMTP_SECURE');
      const secure = secureConfig !== undefined ? secureConfig === 'true' : port === 465;
      const user = this.configService.get<string>('SMTP_USER');
      const pass = this.configService.get<string>('SMTP_PASS');

      this.transporter = nodemailer.createTransport({
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 10000,
        family: 4,
      } as any);
    }
    return this.transporter;
  }

  async sendEventRegistrationEmail(params: {
    event: EventItem;
    registration: {
      id: string;
      name: string;
      email: string;
      phone?: string | null;
      notes?: string | null;
    };
    isPaid: boolean;
    amount: number;
    txnId?: string | null;
  }): Promise<boolean> {
    const email = params.registration.email?.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      this.logger.warn(`Cannot send event confirmation email: invalid email "${email}"`);
      return false;
    }

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3002';

    const { subject, html } = this.buildEventRegistrationEmailTemplate(params, frontendUrl);

    try {
      const transporter = this.getTransporter();
      const fromAddress =
        this.configService.get<string>('SMTP_FROM') ||
        `"AKAM Digital Events" <${this.configService.get('SMTP_USER')}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: `"${params.registration.name || email.split('@')[0]}" <${email}>`,
        subject,
        html,
      });

      this.logger.log(
        `✅ [Event] Registration confirmation email delivered to ${email} for "${params.event.title}". MessageId: ${info.messageId}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `❌ [Event] Failed to send registration email to ${email}: ${(error as Error).message}`,
        (error as Error).stack,
      );
      if (this.configService.get('NODE_ENV') !== 'production') {
        this.logger.log(`[DEV FALLBACK] Event registration email for ${email}: subject="${subject}"`);
      }
      return false;
    }
  }

  private buildEventRegistrationEmailTemplate(
    params: {
      event: EventItem;
      registration: {
        id: string;
        name: string;
        email: string;
        phone?: string | null;
        notes?: string | null;
      };
      isPaid: boolean;
      amount: number;
      txnId?: string | null;
    },
    frontendUrl: string,
  ): { subject: string; html: string } {
    const { event, registration, isPaid, amount, txnId } = params;

    const formattedDate =
      event.day && event.monthYear
        ? `${event.day} ${event.monthYear}`
        : event.eventDate
        ? new Date(event.eventDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'Date to be announced';

    const eventTime = event.time || 'Schedule will be announced';
    const eventLocation = event.location || 'Online / Venue to be announced';
    const eventUrl = `${frontendUrl}/events`;

    const subject = isPaid
      ? `🎟️ Ticket Confirmed: ${event.title} (Pass #${registration.id})`
      : `🎟️ Registration Confirmed: ${event.title} (Pass #${registration.id})`;

    const badgeColor = isPaid ? '#10b981' : '#E4F953';
    const badgeBg = isPaid ? '#ecfdf5' : '#040706';
    const badgeTextColor = isPaid ? '#065f46' : '#E4F953';
    const badgeText = isPaid
      ? 'PAID ADMISSION CONFIRMED'
      : 'COMPLIMENTARY PASS CONFIRMED';

    const statusPill = isPaid
      ? `<span style="display: inline-block; padding: 4px 10px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #065f46; letter-spacing: 0.5px;">PAID • ₹${amount}</span>`
      : `<span style="display: inline-block; padding: 4px 10px; background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 9999px; font-size: 11px; font-weight: 700; color: #334155; letter-spacing: 0.5px;">FREE ADMISSION</span>`;

    const paymentDetailsHtml = isPaid
      ? `
        <tr>
          <td style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #f1f5f9;">Ticket Amount</td>
          <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9; text-align: right;">₹${amount}</td>
        </tr>
        <tr>
          <td style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #f1f5f9;">Payment Status</td>
          <td style="padding: 10px 14px; font-size: 13px; color: #10b981; font-weight: 700; border-bottom: 1px solid #f1f5f9; text-align: right;">COMPLETED (PayU Verified)</td>
        </tr>
        ${
          txnId
            ? `
        <tr>
          <td style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #f1f5f9;">Transaction ID</td>
          <td style="padding: 10px 14px; font-size: 12px; font-family: monospace; color: #334155; font-weight: 600; border-bottom: 1px solid #f1f5f9; text-align: right;">${txnId}</td>
        </tr>
        `
            : ''
        }
      `
      : `
        <tr>
          <td style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #f1f5f9;">Admission Type</td>
          <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9; text-align: right;">Complimentary / Free Entry</td>
        </tr>
      `;

    const coverImageHtml = event.imageSrc
      ? `
        <div style="margin-bottom: 24px; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; max-height: 220px;">
          <img src="${event.imageSrc.startsWith('http') ? event.imageSrc : `${frontendUrl}${event.imageSrc}`}" alt="${event.title}" style="width: 100%; height: auto; max-height: 220px; object-fit: cover; display: block;" />
        </div>
      `
      : '';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #0f172a;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);">
                
                <!-- Brand Header -->
                <tr>
                  <td style="background-color: #040706; padding: 24px 32px; text-align: left;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td>
                          <div style="font-size: 18px; font-weight: 900; letter-spacing: 2px; color: #ffffff; text-transform: uppercase;">
                            AKAM <span style="color: #E4F953;">DIGITAL</span>
                          </div>
                          <div style="font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 2px; letter-spacing: 0.5px;">
                            EVENTS & SESSIONS DESK
                          </div>
                        </td>
                        <td align="right">
                          <span style="background-color: #1e293b; color: #E4F953; font-size: 10px; font-weight: 700; padding: 5px 12px; border-radius: 8px; letter-spacing: 1px; text-transform: uppercase;">
                            ${event.type || 'EVENT'}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content Body -->
                <tr>
                  <td style="padding: 32px;">
                    ${coverImageHtml}

                    <!-- Confirmation Badge -->
                    <div style="margin-bottom: 16px;">
                      <span style="display: inline-block; background-color: ${badgeBg}; color: ${badgeTextColor}; border: 1px solid ${badgeColor}; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; letter-spacing: 0.8px; text-transform: uppercase;">
                        ${badgeText}
                      </span>
                    </div>

                    <h1 style="font-size: 24px; font-weight: 800; color: #040706; margin: 0 0 10px 0; line-height: 1.25; letter-spacing: -0.5px;">
                      ${event.title}
                    </h1>

                    <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
                      Hello <strong>${registration.name}</strong>, your spot for this event has been successfully registered. Please find your event pass and schedule details below.
                    </p>

                    <!-- Pass Card Container -->
                    <div style="background-color: #fafafa; border: 1.5px dashed #cbd5e1; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
                      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                            <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">
                              Registration Pass Number
                            </div>
                            <div style="font-size: 16px; font-weight: 800; font-family: monospace; color: #040706; margin-top: 2px;">
                              ${registration.id}
                            </div>
                          </td>
                          <td align="right" style="padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                            ${statusPill}
                          </td>
                        </tr>

                        <!-- Event Details Grid -->
                        <tr>
                          <td colspan="2" style="padding-top: 14px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                              <tr>
                                <td style="padding: 6px 0; vertical-align: top; width: 32px;">
                                  <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #e2e8f0; text-align: center; line-height: 24px; font-size: 12px;">📅</div>
                                </td>
                                <td style="padding: 6px 0; vertical-align: middle;">
                                  <div style="font-size: 11px; color: #64748b; font-weight: 600;">DATE</div>
                                  <div style="font-size: 13px; color: #040706; font-weight: 700;">${formattedDate}</div>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0; vertical-align: top; width: 32px;">
                                  <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #e2e8f0; text-align: center; line-height: 24px; font-size: 12px;">⏰</div>
                                </td>
                                <td style="padding: 6px 0; vertical-align: middle;">
                                  <div style="font-size: 11px; color: #64748b; font-weight: 600;">TIME</div>
                                  <div style="font-size: 13px; color: #040706; font-weight: 700;">${eventTime}</div>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 6px 0; vertical-align: top; width: 32px;">
                                  <div style="width: 24px; height: 24px; border-radius: 6px; background-color: #e2e8f0; text-align: center; line-height: 24px; font-size: 12px;">📍</div>
                                </td>
                                <td style="padding: 6px 0; vertical-align: middle;">
                                  <div style="font-size: 11px; color: #64748b; font-weight: 600;">VENUE / LOCATION</div>
                                  <div style="font-size: 13px; color: #040706; font-weight: 700;">${eventLocation}</div>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </div>

                    <!-- Payment & Attendee Summary Table -->
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px; overflow: hidden;">
                      <tr style="background-color: #f8fafc;">
                        <th colspan="2" style="padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid #e2e8f0;">
                          Registration & Attendee Summary
                        </th>
                      </tr>
                      <tr>
                        <td style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #f1f5f9;">Attendee</td>
                        <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 700; border-bottom: 1px solid #f1f5f9; text-align: right;">${registration.name}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #f1f5f9;">Email</td>
                        <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 500; border-bottom: 1px solid #f1f5f9; text-align: right;">${registration.email}</td>
                      </tr>
                      ${
                        registration.phone
                          ? `
                      <tr>
                        <td style="padding: 10px 14px; font-size: 12px; color: #64748b; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #f1f5f9;">Phone</td>
                        <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 500; border-bottom: 1px solid #f1f5f9; text-align: right;">${registration.phone}</td>
                      </tr>
                      `
                          : ''
                      }
                      ${paymentDetailsHtml}
                    </table>

                    ${
                      event.description
                        ? `
                    <!-- Event Description Snippet -->
                    <div style="margin-bottom: 24px; padding: 16px; background-color: #f8fafc; border-radius: 12px; border-left: 4px solid #040706;">
                      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">About This Session</div>
                      <div style="font-size: 13px; color: #334155; line-height: 1.5;">${event.description}</div>
                    </div>
                    `
                        : ''
                    }

                    <!-- CTA Button -->
                    <div style="text-align: center; margin: 32px 0 24px 0;">
                      <a href="${eventUrl}" target="_blank" style="display: inline-block; background-color: #040706; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 12px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(4, 7, 6, 0.2);">
                        View Event on AKAM Digital →
                      </a>
                    </div>

                    <!-- Important Instructions -->
                    <div style="padding: 16px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 12px; font-size: 12px; color: #713f12; line-height: 1.5;">
                      <strong>📌 Important Event Information:</strong>
                      <ul style="margin: 6px 0 0 0; padding-left: 18px;">
                        <li>Please arrive 15 minutes before the scheduled time to ensure smooth seating.</li>
                        <li>Present this email (digital copy or printout) at the registration desk for entry.</li>
                        <li>For any questions, reach out to our team at <a href="mailto:support@akamdigital.com" style="color: #854d0e; font-weight: 700;">support@akamdigital.com</a>.</li>
                      </ul>
                    </div>

                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
                    <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0; font-weight: 500;">
                      AKAM Digital • The Modern Storytelling Platform
                    </p>
                    <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                      © ${new Date().getFullYear()} AKAM Digital. All rights reserved.
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

    return { subject, html };
  }

  async registerForEvent(eventId: string, dto: any, userId?: string) {
    const event = await this.findOne(eventId);
    const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const isPaidEvent = Boolean(event.isPaid);
    const amount = isPaidEvent ? (Number(event.price) || 0) : 0;
    const paymentStatus = isPaidEvent
      ? (dto.paymentStatus || (dto.txnId ? 'COMPLETED' : 'PENDING'))
      : 'FREE';
    const txnId = dto.txnId?.trim() || null;

    let row: any = null;

    if (txnId) {
      const existing = await this.prisma.queryOne(
        `SELECT * FROM "event_registration" WHERE "txnId" = $1`,
        [txnId]
      );
      if (existing) {
        if (existing.paymentStatus !== paymentStatus) {
          row = await this.prisma.queryOne(
            `UPDATE "event_registration"
             SET "paymentStatus" = $1, amount = $2, "isPaid" = true
             WHERE "txnId" = $3
             RETURNING id, "eventId", "userId", name, email, phone, notes, "isPaid", amount::float as amount, "paymentStatus", "txnId", "createdAt"`,
            [paymentStatus, amount, txnId]
          );
        } else {
          row = existing;
        }

        if (paymentStatus === 'COMPLETED' && existing.paymentStatus !== 'COMPLETED') {
          this.sendEventRegistrationEmail({
            event,
            registration: {
              id: row.id,
              name: row.name,
              email: row.email,
              phone: row.phone,
              notes: row.notes,
            },
            isPaid: true,
            amount,
            txnId,
          }).catch((err) => {
            this.logger.error(`[Event] Email send error for ${dto.email}: ${err?.message}`);
          });
        }

        return {
          success: true,
          message: `Payment verified & registration confirmed for ${event.title}`,
          registration: row,
        };
      }
    }

    row = await this.prisma.queryOne(
      `INSERT INTO "event_registration" (id, "eventId", "userId", name, email, phone, notes, "isPaid", amount, "paymentStatus", "txnId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, "eventId", "userId", name, email, phone, notes, "isPaid", amount::float as amount, "paymentStatus", "txnId", "createdAt"`,
      [
        regId,
        event.id,
        userId || null,
        dto.name.trim(),
        dto.email.trim().toLowerCase(),
        dto.phone?.trim() || null,
        dto.notes?.trim() || null,
        isPaidEvent,
        amount,
        paymentStatus,
        txnId,
      ]
    );

    // Asynchronously dispatch confirmation email in background (non-blocking)
    if (paymentStatus === 'COMPLETED' || paymentStatus === 'FREE') {
      this.sendEventRegistrationEmail({
        event,
        registration: {
          id: regId,
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone?.trim() || null,
          notes: dto.notes?.trim() || null,
        },
        isPaid: isPaidEvent,
        amount,
        txnId,
      }).catch((err) => {
        this.logger.error(`[Event] Background registration email error for ${dto.email}: ${err?.message}`);
      });
    }

    return {
      success: true,
      message: isPaidEvent
        ? `Payment verified & registration confirmed for ${event.title}`
        : `Registered successfully for ${event.title}`,
      registration: row,
    };
  }

  async getEventRegistrations(eventId: string) {
    const event = await this.findOne(eventId);
    const registrations = await this.prisma.query(
      `SELECT id, "eventId", "userId", name, email, phone, notes, "isPaid", amount::float as amount, "paymentStatus", "txnId", "createdAt"
       FROM "event_registration"
       WHERE "eventId" = $1
       ORDER BY "createdAt" DESC`,
      [eventId]
    );

    return {
      event,
      registrations,
      total: registrations.length,
    };
  }

  async createBoltPayloadForEvent(
    eventId: string,
    dto: { name: string; email: string; phone?: string; notes?: string },
    userId?: string
  ) {
    const event = await this.findOne(eventId);
    if (!event.isPaid || Number(event.price) <= 0) {
      throw new BadRequestException('This event is free. Online payment is not required.');
    }

    const amount = Number(event.price);
    const safeTitle = (event.title || 'Event Ticket').replace(/[^a-zA-Z0-9 ]/g, '').trim().substring(0, 30);

    const payload = this.payUService.createBoltPayload({
      userId: userId || `guest_${Date.now()}`,
      email: dto.email,
      name: dto.name,
      phone: dto.phone,
      planType: 'EVENT_TICKET',
      productInfo: `Ticket: ${safeTitle}`,
      amount,
    });

    const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Store in DB with status PENDING so the PayU callback is guaranteed to find it!
    await this.prisma.queryOne(
      `INSERT INTO "event_registration" (id, "eventId", "userId", name, email, phone, notes, "isPaid", amount, "paymentStatus", "txnId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, 'PENDING', $9)
       RETURNING id`,
      [
        regId,
        event.id,
        userId || null,
        dto.name.trim(),
        dto.email.trim().toLowerCase(),
        dto.phone?.trim() || null,
        dto.notes?.trim() || null,
        amount,
        payload.txnid,
      ]
    );

    this.pendingEventRegistrations.set(payload.txnid, {
      id: regId,
      eventId: event.id,
      userId: userId || undefined,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() || undefined,
      notes: dto.notes?.trim() || undefined,
      amount,
      createdAt: Date.now(),
    });

    return payload;
  }

  async confirmPaidEventRegistration(txnid: string, body?: any): Promise<boolean> {
    this.logger.log(`[Event Payment] Confirming paid registration for txnid=${txnid}`);

    // 1. Search existing record by txnId
    const existing = await this.prisma.queryOne<any>(
      `SELECT er.*, e.title as "eventTitle", e."day", e."monthYear", e."eventDate", e.time, e.location, e."imageSrc", e.type as "eventType"
       FROM "event_registration" er
       JOIN "event" e ON er."eventId" = e.id
       WHERE er."txnId" = $1`,
      [txnid]
    );

    if (existing) {
      if (existing.paymentStatus !== 'COMPLETED') {
        await this.prisma.execute(
          `UPDATE "event_registration" SET "paymentStatus" = 'COMPLETED' WHERE id = $1`,
          [existing.id]
        );
        this.logger.log(`[Event Payment] Updated registration ${existing.id} to COMPLETED for txnid=${txnid}`);

        // Send email
        const event = await this.findOne(existing.eventId);
        this.sendEventRegistrationEmail({
          event,
          registration: {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            phone: existing.phone,
            notes: existing.notes,
          },
          isPaid: true,
          amount: Number(existing.amount),
          txnId: txnid,
        }).catch((err) => {
          this.logger.error(`[Event Payment] Email send error for ${existing.email}: ${err?.message}`);
        });
      }
      return true;
    }

    // 2. Check pending in-memory registration
    const pending = this.pendingEventRegistrations.get(txnid);
    if (pending) {
      this.logger.log(`[Event Payment] Creating registration from pending memory for txnid=${txnid}`);
      await this.registerForEvent(
        pending.eventId,
        {
          name: pending.name,
          email: pending.email,
          phone: pending.phone,
          notes: pending.notes,
          isPaid: true,
          amount: pending.amount,
          paymentStatus: 'COMPLETED',
          txnId: txnid,
        },
        pending.userId
      );
      this.pendingEventRegistrations.delete(txnid);
      return true;
    }

    // 3. Fallback: Parse from PayU callback body
    if (body) {
      const email = String(body.email || '').trim().toLowerCase();
      const firstname = String(body.firstname || 'Attendee').trim();
      const phone = String(body.phone || '').trim();
      const amount = Number(body.amount || 0);

      // Find the paid event matching this price
      const paidEvents = await this.prisma.query<EventItem>(
        `SELECT * FROM "event" WHERE "isPaid" = true AND "isPublished" = true ORDER BY "updatedAt" DESC LIMIT 5`
      );
      const matchingEvent = paidEvents.find((e) => Math.abs(Number(e.price) - amount) < 0.01) || paidEvents[0];

      if (matchingEvent && email) {
        this.logger.log(`[Event Payment Fallback] Creating registration from callback body for event=${matchingEvent.id}, email=${email}`);
        await this.registerForEvent(
          matchingEvent.id,
          {
            name: firstname,
            email,
            phone: phone || undefined,
            isPaid: true,
            amount,
            paymentStatus: 'COMPLETED',
            txnId: txnid,
          }
        );
        return true;
      }
    }

    this.logger.warn(`[Event Payment] No event found to confirm for txnid=${txnid}`);
    return false;
  }

  async getRegistrationByTxnOrId(identifier: string) {
    if (!identifier) {
      throw new NotFoundException('Registration reference is required');
    }

    const row = await this.prisma.queryOne<any>(
      `SELECT er.id, er."eventId", er."userId", er.name, er.email, er.phone, er.notes, er."isPaid",
              er.amount::float as amount, er."paymentStatus", er."txnId", er."createdAt",
              e.title as "eventTitle", e."day", e."monthYear", e."eventDate", e.time, e.location,
              e."imageSrc", e.type as "eventType", e.description as "eventDescription"
       FROM "event_registration" er
       LEFT JOIN "event" e ON er."eventId" = e.id
       WHERE er."txnId" = $1 OR er.id = $1`,
      [identifier]
    );

    if (!row) {
      throw new NotFoundException(`Registration record for "${identifier}" was not found`);
    }

    return row;
  }

  async create(dto: CreateEventDto): Promise<EventItem> {
    const id = `evt-${Date.now()}`;
    const isPublished = dto.isPublished ?? true;
    const isPaid = Boolean(dto.isPaid);
    const price = isPaid ? (typeof dto.price === 'number' && dto.price >= 0 ? dto.price : (Number(dto.price) || 0)) : 0;

    const imagesList = dto.images && Array.isArray(dto.images) && dto.images.length > 0
      ? dto.images
      : (dto.imageSrc ? [dto.imageSrc] : []);

    let eventDate: Date | null = null;
    if (dto.eventDate) {
      const parsed = new Date(dto.eventDate);
      if (!isNaN(parsed.getTime())) eventDate = parsed;
    } else if (dto.day && dto.monthYear) {
      const parts = dto.day.split(/[-–—]|to/i).map((s: string) => s.trim());
      const firstNum = parts[0]?.match(/\d+/);
      if (firstNum) {
        const parsed = new Date(`${firstNum[0]} ${dto.monthYear}`);
        if (!isNaN(parsed.getTime())) eventDate = parsed;
      }
    }

    const row = await this.prisma.queryOne<EventItem>(
      `INSERT INTO "event" (id, type, title, description, location, time, day, "monthYear", "eventDate", "imageSrc", images, "videoUrl", "registerHref", "isPublished", "isPaid", price)
       VALUES ($1, $2::"EventType", $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING ${SELECT_FIELDS}`,
      [
        id,
        dto.type,
        dto.title,
        dto.description,
        dto.location,
        dto.time ?? null,
        dto.day ?? null,
        dto.monthYear ?? null,
        eventDate,
        dto.imageSrc ?? (imagesList[0] || null),
        imagesList,
        dto.videoUrl ?? null,
        dto.registerHref ?? null,
        isPublished,
        isPaid,
        price,
      ]
    );

    return row!;
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventItem> {
    const existing = await this.findOne(id);

    const type = dto.type ?? existing.type;
    const title = dto.title ?? existing.title;
    const description = dto.description ?? existing.description;
    const location = dto.location ?? existing.location;
    const time = dto.time !== undefined ? dto.time : existing.time;
    const day = dto.day !== undefined ? dto.day : existing.day;
    const monthYear = dto.monthYear !== undefined ? dto.monthYear : existing.monthYear;
    const imageSrc = dto.imageSrc !== undefined ? dto.imageSrc : existing.imageSrc;
    const imagesList = dto.images !== undefined ? dto.images : (existing.images || []);
    const videoUrl = dto.videoUrl !== undefined ? dto.videoUrl : existing.videoUrl;
    const registerHref = dto.registerHref !== undefined ? dto.registerHref : existing.registerHref;
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : existing.isPublished;
    const isPaid = dto.isPaid !== undefined ? Boolean(dto.isPaid) : existing.isPaid;
    const price = dto.price !== undefined ? (Number(dto.price) || 0) : existing.price;

    let eventDate = existing.eventDate;
    if (dto.eventDate !== undefined) {
      if (dto.eventDate) {
        const parsed = new Date(dto.eventDate);
        if (!isNaN(parsed.getTime())) eventDate = parsed;
      } else {
        eventDate = null;
      }
    } else if (dto.day !== undefined || dto.monthYear !== undefined) {
      const dayVal = dto.day !== undefined ? dto.day : existing.day;
      const myVal = dto.monthYear !== undefined ? dto.monthYear : existing.monthYear;
      if (dayVal && myVal) {
        const parts = dayVal.split(/[-–—]|to/i).map((s: string) => s.trim());
        const firstNum = parts[0]?.match(/\d+/);
        if (firstNum) {
          const parsed = new Date(`${firstNum[0]} ${myVal}`);
          if (!isNaN(parsed.getTime())) eventDate = parsed;
        }
      }
    }

    if (dto.imageSrc !== undefined && dto.imageSrc !== existing.imageSrc && existing.imageSrc) {
      this.uploadsService.deleteFileByUrl(existing.imageSrc);
    }

    const row = await this.prisma.queryOne<EventItem>(
      `UPDATE "event"
       SET
         type = $1::"EventType",
         title = $2,
         description = $3,
         location = $4,
         time = $5,
         day = $6,
         "monthYear" = $7,
         "eventDate" = $8,
         "imageSrc" = $9,
         images = $10,
         "videoUrl" = $11,
         "registerHref" = $12,
         "isPublished" = $13,
         "isPaid" = $14,
         price = $15,
         "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $16
       RETURNING ${SELECT_FIELDS}`,
      [type, title, description, location, time, day, monthYear, eventDate, imageSrc, imagesList, videoUrl, registerHref, isPublished, isPaid, price, id]
    );

    return row!;
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    if (existing.imageSrc) {
      this.uploadsService.deleteFileByUrl(existing.imageSrc);
    }
    await this.prisma.execute(`DELETE FROM "event" WHERE id = $1`, [id]);
    return { success: true, message: 'Event deleted successfully' };
  }

  async togglePublish(id: string): Promise<EventItem> {
    const existing = await this.findOne(id);
    const updatedStatus = !existing.isPublished;

    const row = await this.prisma.queryOne<EventItem>(
      `UPDATE "event"
       SET "isPublished" = $1, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING ${SELECT_FIELDS}`,
      [updatedStatus, id]
    );

    return row!;
  }

  getFrontendUrl(): string {
    return this.payUService.getFrontendUrl();
  }

  verifyPayUResponse(body: Record<string, any>) {
    return this.payUService.verifyResponseHash(body);
  }
}
