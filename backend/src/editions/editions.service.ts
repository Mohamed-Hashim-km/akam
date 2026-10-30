import { Injectable, NotFoundException, Optional, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { RevalidateService } from '../common/revalidate/revalidate.service.js';
import { CreateEditionDto } from './dto/create-edition.dto.js';
import { UpdateEditionDto } from './dto/update-edition.dto.js';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import type { Request, Response } from 'express';

@Injectable()
export class EditionsService {
  private readonly logger = new Logger(EditionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly revalidateService: RevalidateService,
    @Optional() private readonly subscriptionService?: SubscriptionService,
  ) {}

  async checkUserHasSubscription(userId?: string, userRole?: string): Promise<boolean> {
    const roleUpper = (userRole || '').toUpperCase();
    if (['ADMIN', 'EDITOR', 'EDITORIAL', 'CHIEF_EDITOR', 'STAFF_EDITOR'].includes(roleUpper)) {
      return true;
    }
    if (!userId || !this.subscriptionService) {
      return false;
    }
    try {
      const sub = await this.subscriptionService.getByUserId(userId);
      return Boolean(sub && sub.status === 'ACTIVE' && new Date(sub.endDate) > new Date());
    } catch {
      return false;
    }
  }

  async getRealPdfUrl(id: string): Promise<string | null> {
    const sql = `SELECT "pdfUrl" FROM "edition" WHERE "id" = $1 LIMIT 1`;
    const row = await this.prisma.queryOne<{ pdfUrl: string | null }>(sql, [id]);
    return row?.pdfUrl || null;
  }

  /** Public: only published editions, ordered by sortOrder ASC, createdAt DESC */
  async findAllPublished(userId?: string, userRole?: string) {
    const hasAccess = await this.checkUserHasSubscription(userId, userRole);
    const sql = `
      SELECT "id", "title", "pdfUrl", "coverImage", "isPublished", "sortOrder", "createdAt", "updatedAt"
      FROM "edition"
      WHERE "isPublished" = true
      ORDER BY "sortOrder" ASC, "createdAt" DESC
    `;
    const rows = await this.prisma.query<any>(sql);
    return rows.map((r) => ({
      ...r,
      pdfUrl: hasAccess && r.pdfUrl ? `/api/editions/${r.id}/read-pdf` : null,
      hasAccess,
    }));
  }

  /** Public paginated: published editions with page & limit */
  async findAllPublishedPaginated(page = 1, limit = 3, userId?: string, userRole?: string) {
    const hasAccess = await this.checkUserHasSubscription(userId, userRole);
    const offset = (page - 1) * limit;
    const countSql = `SELECT COUNT(*) FROM "edition" WHERE "isPublished" = true`;
    const countRes = await this.prisma.query<{ count: string }>(countSql);
    const total = parseInt(countRes[0]?.count || '0', 10);

    const dataSql = `
      SELECT "id", "title", "pdfUrl", "coverImage", "isPublished", "sortOrder", "createdAt", "updatedAt"
      FROM "edition"
      WHERE "isPublished" = true
      ORDER BY "sortOrder" ASC, "createdAt" DESC
      LIMIT $1 OFFSET $2
    `;

    const data = await this.prisma.query<any>(dataSql, [limit, offset]);
    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;

    const mappedData = data.map((item: any) => ({
      ...item,
      pdfUrl: hasAccess && item.pdfUrl ? `/api/editions/${item.id}/read-pdf` : null,
      hasAccess,
    }));

    return { data: mappedData, meta: { total, page, limit, totalPages, hasMore, hasAccess } };
  }

  /** Editorial: all editions with pagination and search */
  async findAllEditorial(page = 1, limit = 10, search?: string) {
    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereConditions.push(`"title" ILIKE $${params.length}`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM "edition" ${whereClause}`;
    const countRes = await this.prisma.query<{ count: string }>(countSql, params);
    const total = parseInt(countRes[0]?.count || '0', 10);

    const dataParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataSql = `
      SELECT "id", "title", "pdfUrl", "coverImage", "isPublished", "sortOrder", "createdAt", "updatedAt"
      FROM "edition"
      ${whereClause}
      ORDER BY "sortOrder" ASC, "createdAt" DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const data = await this.prisma.query<any>(dataSql, dataParams);
    const totalPages = Math.ceil(total / limit) || 1;

    return { data, meta: { total, page, limit, totalPages } };
  }

  async findOne(id: string, userId?: string, userRole?: string, bypassAccess = false) {
    const sql = `SELECT * FROM "edition" WHERE "id" = $1 LIMIT 1`;
    const item = await this.prisma.queryOne<any>(sql, [id]);
    if (!item) throw new NotFoundException(`Edition with ID ${id} not found`);

    if (bypassAccess) {
      return item;
    }

    const hasAccess = await this.checkUserHasSubscription(userId, userRole);
    return {
      ...item,
      pdfUrl: hasAccess && item.pdfUrl ? `/api/editions/${item.id}/read-pdf` : null,
      hasAccess,
    };
  }

  async streamPdf(fileUrl: string, req: Request, res: Response) {
    // 1. Try resolving locally from uploads directory
    let localPath: string | null = null;
    const uploadIdx = fileUrl.indexOf('/uploads/');
    if (uploadIdx !== -1) {
      const rel = fileUrl.substring(uploadIdx + '/uploads/'.length);
      const candidate = path.normalize(path.join(process.cwd(), 'uploads', rel));
      if (
        candidate.startsWith(path.join(process.cwd(), 'uploads')) &&
        fs.existsSync(candidate) &&
        fs.statSync(candidate).isFile()
      ) {
        localPath = candidate;
      }
    }

    if (!localPath) {
      const basename = path.basename(fileUrl.split('?')[0]);
      const candidatePdf = path.join(process.cwd(), 'uploads', 'pdfs', basename);
      if (fs.existsSync(candidatePdf) && fs.statSync(candidatePdf).isFile()) {
        localPath = candidatePdf;
      }
    }

    // Common security and anti-download headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Disposition', 'inline; filename="edition-reader.pdf"');
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    if (localPath) {
      const stat = fs.statSync(localPath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
        res.setHeader('Content-Length', chunkSize);

        const fileStream = fs.createReadStream(localPath, { start, end });
        return fileStream.pipe(res);
      } else {
        res.status(200);
        res.setHeader('Content-Length', fileSize);
        const fileStream = fs.createReadStream(localPath);
        return fileStream.pipe(res);
      }
    }

    // 2. If remote URL, proxy stream it from remote storage
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      try {
        const upstreamHeaders: Record<string, string> = {};
        if (req.headers.range) {
          upstreamHeaders['Range'] = req.headers.range as string;
        }

        const upstreamRes = await fetch(fileUrl, {
          headers: upstreamHeaders,
        });

        if (!upstreamRes.ok && upstreamRes.status !== 206) {
          throw new NotFoundException('Could not retrieve edition PDF from remote storage');
        }

        res.status(upstreamRes.status);
        const ct = upstreamRes.headers.get('content-type');
        if (ct) res.setHeader('Content-Type', ct);
        const cl = upstreamRes.headers.get('content-length');
        if (cl) res.setHeader('Content-Length', cl);
        const cr = upstreamRes.headers.get('content-range');
        if (cr) res.setHeader('Content-Range', cr);

        if (upstreamRes.body) {
          const stream = Readable.fromWeb(upstreamRes.body as any);
          return stream.pipe(res);
        } else {
          return res.end();
        }
      } catch (err) {
        this.logger.error(`Error streaming remote PDF ${fileUrl}:`, err);
        if (!res.headersSent) {
          return res.status(502).json({ statusCode: 502, message: 'Failed to fetch edition PDF.' });
        }
        return res.end();
      }
    }

    throw new NotFoundException('Edition PDF file not found on disk or remote storage');
  }

  async create(dto: CreateEditionDto) {
    const id = randomUUID();
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : true;
    const sortOrder = dto.sortOrder !== undefined ? dto.sortOrder : 0;

    const sql = `
      INSERT INTO "edition" ("id", "title", "pdfUrl", "coverImage", "isPublished", "sortOrder", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const result = await this.prisma.queryOne<any>(sql, [
      id,
      dto.title,
      dto.pdfUrl,
      dto.coverImage ?? null,
      isPublished,
      sortOrder,
    ]);
    this.revalidateService.revalidate('editions', '/emagazine');
    return result;
  }

  async update(id: string, dto: UpdateEditionDto) {
    const existing = await this.findOne(id, undefined, undefined, true);
    const title = dto.title ?? existing.title;
    const pdfUrl = dto.pdfUrl ?? existing.pdfUrl;
    const coverImage = dto.coverImage !== undefined ? dto.coverImage : existing.coverImage;
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : existing.isPublished;
    const sortOrder = dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder;

    if (dto.pdfUrl !== undefined && dto.pdfUrl !== existing.pdfUrl && existing.pdfUrl) {
      this.uploadsService.deleteFileByUrl(existing.pdfUrl);
    }

    if (dto.coverImage !== undefined && dto.coverImage !== existing.coverImage && existing.coverImage) {
      this.uploadsService.deleteFileByUrl(existing.coverImage);
    }

    const sql = `
      UPDATE "edition"
      SET "title" = $2, "pdfUrl" = $3, "coverImage" = $4, "isPublished" = $5, "sortOrder" = $6, "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING *
    `;
    const result = await this.prisma.queryOne<any>(sql, [id, title, pdfUrl, coverImage, isPublished, sortOrder]);
    this.revalidateService.revalidate('editions', '/emagazine');
    return result;
  }

  async togglePublish(id: string) {
    const existing = await this.findOne(id, undefined, undefined, true);
    const sql = `
      UPDATE "edition"
      SET "isPublished" = $2, "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING *
    `;
    const result = await this.prisma.queryOne<any>(sql, [id, !existing.isPublished]);
    this.revalidateService.revalidate('editions', '/emagazine');
    return result;
  }

  async remove(id: string) {
    const existing = await this.findOne(id, undefined, undefined, true);
    if (existing.pdfUrl) {
      this.uploadsService.deleteFileByUrl(existing.pdfUrl);
    }
    if (existing.coverImage) {
      this.uploadsService.deleteFileByUrl(existing.coverImage);
    }
    await this.prisma.execute(`DELETE FROM "edition" WHERE "id" = $1`, [id]);
    this.revalidateService.revalidate('editions', '/emagazine');
    return { message: 'Edition deleted successfully', id };
  }
}
