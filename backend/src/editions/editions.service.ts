import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { CreateEditionDto } from './dto/create-edition.dto.js';
import { UpdateEditionDto } from './dto/update-edition.dto.js';
import { randomUUID } from 'crypto';

@Injectable()
export class EditionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  /** Public: only published editions, ordered by sortOrder ASC, createdAt DESC */
  async findAllPublished() {
    const sql = `
      SELECT "id", "title", "pdfUrl", "coverImage", "isPublished", "sortOrder", "createdAt", "updatedAt"
      FROM "edition"
      WHERE "isPublished" = true
      ORDER BY "sortOrder" ASC, "createdAt" DESC
    `;
    return this.prisma.query<any>(sql);
  }

  /** Public paginated: published editions with page & limit */
  async findAllPublishedPaginated(page = 1, limit = 3) {
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

    return { data, meta: { total, page, limit, totalPages, hasMore } };
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

  async findOne(id: string) {
    const sql = `SELECT * FROM "edition" WHERE "id" = $1 LIMIT 1`;
    const item = await this.prisma.queryOne<any>(sql, [id]);
    if (!item) throw new NotFoundException(`Edition with ID ${id} not found`);
    return item;
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
    return this.prisma.queryOne<any>(sql, [
      id,
      dto.title,
      dto.pdfUrl,
      dto.coverImage ?? null,
      isPublished,
      sortOrder,
    ]);
  }

  async update(id: string, dto: UpdateEditionDto) {
    const existing = await this.findOne(id);
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
    return this.prisma.queryOne<any>(sql, [id, title, pdfUrl, coverImage, isPublished, sortOrder]);
  }

  async togglePublish(id: string) {
    const existing = await this.findOne(id);
    const sql = `
      UPDATE "edition"
      SET "isPublished" = $2, "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING *
    `;
    return this.prisma.queryOne<any>(sql, [id, !existing.isPublished]);
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    if (existing.pdfUrl) {
      this.uploadsService.deleteFileByUrl(existing.pdfUrl);
    }
    if (existing.coverImage) {
      this.uploadsService.deleteFileByUrl(existing.coverImage);
    }
    await this.prisma.execute(`DELETE FROM "edition" WHERE "id" = $1`, [id]);
    return { message: 'Edition deleted successfully', id };
  }
}
