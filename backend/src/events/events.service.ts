import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { CreateEventDto } from './dto/create-event.dto.js';
import { UpdateEventDto } from './dto/update-event.dto.js';
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
  createdAt: Date;
  updatedAt: Date;
}

const SELECT_FIELDS = `id, type, title, description, location, time, day, "monthYear", "eventDate", "imageSrc", images, "videoUrl", "registerHref", "isPublished", "createdAt", "updatedAt"`;

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
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
        e.id, e.type, e.title, e.description, e.location, e.time, e.day, e."monthYear", e."eventDate", e."imageSrc", e.images, e."videoUrl", e."registerHref", e."isPublished", e."createdAt", e."updatedAt",
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

  async registerForEvent(eventId: string, dto: any, userId?: string) {
    const event = await this.findOne(eventId);
    const regId = `reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const row = await this.prisma.queryOne(
      `INSERT INTO "event_registration" (id, "eventId", "userId", name, email, phone, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, "eventId", "userId", name, email, phone, notes, "createdAt"`,
      [regId, event.id, userId || null, dto.name.trim(), dto.email.trim().toLowerCase(), dto.phone?.trim() || null, dto.notes?.trim() || null]
    );

    return {
      success: true,
      message: `Registered successfully for ${event.title}`,
      registration: row,
    };
  }

  async getEventRegistrations(eventId: string) {
    const event = await this.findOne(eventId);
    const registrations = await this.prisma.query(
      `SELECT id, "eventId", "userId", name, email, phone, notes, "createdAt"
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

  async create(dto: CreateEventDto): Promise<EventItem> {
    const id = `evt-${Date.now()}`;
    const isPublished = dto.isPublished ?? true;
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
      `INSERT INTO "event" (id, type, title, description, location, time, day, "monthYear", "eventDate", "imageSrc", images, "videoUrl", "registerHref", "isPublished")
       VALUES ($1, $2::"EventType", $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
         "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING ${SELECT_FIELDS}`,
      [type, title, description, location, time, day, monthYear, eventDate, imageSrc, imagesList, videoUrl, registerHref, isPublished, id]
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
}
