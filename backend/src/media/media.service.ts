import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateMediaDto } from './dto/create-media.dto.js';
import { UpdateMediaDto } from './dto/update-media.dto.js';
import { randomUUID } from 'crypto';

export function extractYouTubeId(url: string): string {
  if (!url) return '';
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url.trim();
}

@Injectable()
export class MediaService {
  constructor(private readonly prisma: PrismaService) {}

  private async checkFeaturedLimit(excludeId?: string) {
    const params: any[] = [];
    let sql = `SELECT COUNT(*) FROM "media_video" WHERE "isFeatured" = true`;
    if (excludeId) {
      params.push(excludeId);
      sql += ` AND "id" != $1`;
    }
    const res = await this.prisma.query<{ count: string }>(sql, params);
    const count = parseInt(res[0]?.count || '0', 10);
    if (count >= 3) {
      throw new BadRequestException(
        'Maximum of 3 featured videos allowed on the homepage. Please un-feature an existing featured video first.'
      );
    }
  }

  async findAllPublishedPaginated(category?: string, page = 1, limit = 6, featured?: boolean) {
    const offset = (page - 1) * limit;

    let whereClause = `WHERE "isPublished" = true`;
    const params: any[] = [];

    if (featured) {
      whereClause += ` AND "isFeatured" = true`;
    }

    if (category && category !== 'ALL') {
      params.push(category);
      whereClause += ` AND "category" = $${params.length}`;
    }

    const countSql = `SELECT COUNT(*) FROM "media_video" ${whereClause}`;
    const countRes = await this.prisma.query<{ count: string }>(countSql, params);
    const total = parseInt(countRes[0]?.count || '0', 10);

    const dataParams = [...params, limit, offset];
    const limitParamIndex = params.length + 1;
    const offsetParamIndex = params.length + 2;

    const dataSql = `
      SELECT "id", "title", "description", "category", "youtubeUrl", "youtubeId", "isPublished", "isFeatured", "createdAt", "updatedAt"
      FROM "media_video"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const data = await this.prisma.query<any>(dataSql, dataParams);
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

  async findAllEditorialPaginated(page = 1, limit = 9, search?: string, category?: string) {
    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (category && category !== 'ALL') {
      params.push(category);
      whereConditions.push(`"category" = $${params.length}`);
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereConditions.push(`("title" ILIKE $${params.length} OR "description" ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM "media_video" ${whereClause}`;
    const countRes = await this.prisma.query<{ count: string }>(countSql, params);
    const total = parseInt(countRes[0]?.count || '0', 10);

    const dataParams = [...params, limit, offset];
    const limitParamIndex = params.length + 1;
    const offsetParamIndex = params.length + 2;

    const dataSql = `
      SELECT "id", "title", "description", "category", "youtubeUrl", "youtubeId", "isPublished", "isFeatured", "createdAt", "updatedAt"
      FROM "media_video"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    const data = await this.prisma.query<any>(dataSql, dataParams);
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

  async findOne(id: string) {
    const sql = `SELECT * FROM "media_video" WHERE "id" = $1 LIMIT 1`;
    const item = await this.prisma.queryOne<any>(sql, [id]);
    if (!item) {
      throw new NotFoundException(`Media video with ID ${id} not found`);
    }
    return item;
  }

  async create(dto: CreateMediaDto) {
    const id = randomUUID();
    const ytId = extractYouTubeId(dto.youtubeUrl);
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : true;
    const isFeatured = dto.isFeatured !== undefined ? dto.isFeatured : false;

    if (isFeatured) {
      await this.checkFeaturedLimit();
    }

    const sql = `
      INSERT INTO "media_video" ("id", "title", "description", "category", "youtubeUrl", "youtubeId", "isPublished", "isFeatured", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    return this.prisma.queryOne<any>(sql, [
      id,
      dto.title,
      dto.description,
      dto.category,
      dto.youtubeUrl,
      ytId,
      isPublished,
      isFeatured,
    ]);
  }

  async update(id: string, dto: UpdateMediaDto) {
    const existing = await this.findOne(id);
    const title = dto.title ?? existing.title;
    const description = dto.description ?? existing.description;
    const category = dto.category ?? existing.category;
    const youtubeUrl = dto.youtubeUrl ?? existing.youtubeUrl;
    const youtubeId = dto.youtubeUrl ? extractYouTubeId(dto.youtubeUrl) : existing.youtubeId;
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : existing.isPublished;
    const isFeatured = dto.isFeatured !== undefined ? dto.isFeatured : existing.isFeatured;

    if (isFeatured && !existing.isFeatured) {
      await this.checkFeaturedLimit(id);
    }

    const sql = `
      UPDATE "media_video"
      SET "title" = $2, "description" = $3, "category" = $4, "youtubeUrl" = $5, "youtubeId" = $6, "isPublished" = $7, "isFeatured" = $8, "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING *
    `;

    return this.prisma.queryOne<any>(sql, [
      id,
      title,
      description,
      category,
      youtubeUrl,
      youtubeId,
      isPublished,
      isFeatured,
    ]);
  }

  async togglePublish(id: string) {
    const existing = await this.findOne(id);
    const newStatus = !existing.isPublished;
    const sql = `
      UPDATE "media_video"
      SET "isPublished" = $2, "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING *
    `;
    return this.prisma.queryOne<any>(sql, [id, newStatus]);
  }

  async toggleFeatured(id: string) {
    const existing = await this.findOne(id);
    const newStatus = !existing.isFeatured;

    if (newStatus) {
      await this.checkFeaturedLimit(id);
    }

    const sql = `
      UPDATE "media_video"
      SET "isFeatured" = $2, "updatedAt" = NOW()
      WHERE "id" = $1
      RETURNING *
    `;
    return this.prisma.queryOne<any>(sql, [id, newStatus]);
  }

  async remove(id: string) {
    await this.findOne(id);
    const sql = `DELETE FROM "media_video" WHERE "id" = $1`;
    await this.prisma.query(sql, [id]);
    return { message: 'Media video deleted successfully', id };
  }
}
