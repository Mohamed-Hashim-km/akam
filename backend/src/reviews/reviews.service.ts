import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { UpdateReviewDto } from './dto/update-review.dto.js';

export interface ReviewItem {
  id: string;
  name: string;
  role: string | null;
  quote: string;
  image: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async onModuleInit() {
    await this.prisma.execute(`
      CREATE TABLE IF NOT EXISTS "review" (
        "id" VARCHAR(255) PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "role" VARCHAR(255),
        "quote" TEXT NOT NULL,
        "image" TEXT,
        "isPublished" BOOLEAN DEFAULT true,
        "sortOrder" INT DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if initial seed needed
    const countRes = await this.prisma.queryOne<{ count: number }>(`SELECT COUNT(*)::int as count FROM "review"`);
    if (countRes && countRes.count === 0) {
      await this.prisma.execute(
        `INSERT INTO "review" (id, name, role, quote, image, "isPublished", "sortOrder")
         VALUES 
         ($1, $2, $3, $4, $5, $6, $7),
         ($8, $9, $10, $11, $12, $13, $14)`,
        [
          'rev-1',
          'Rohan V.',
          'Doctor',
          'AKAM Digital has made discovering Malayalam literature feel fresh and exciting. I love being able to explore new writers, stories, and conversations in one place.',
          'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=800&auto=format&fit=crop',
          true,
          1,
          'rev-2',
          'Anjali Menon',
          'Architect & Writer',
          'A magnificent initiative connecting readers and creators. The curated publications and community forums are truly top notch.',
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
          true,
          2,
        ]
      );
    }
  }

  async findAllPublished(): Promise<ReviewItem[]> {
    return this.prisma.query<ReviewItem>(
      `SELECT id, name, role, quote, image, "isPublished", "sortOrder", "createdAt", "updatedAt"
       FROM "review"
       WHERE "isPublished" = true
       ORDER BY "sortOrder" ASC, "createdAt" DESC`
    );
  }

  async findOne(id: string): Promise<ReviewItem> {
    const review = await this.prisma.queryOne<ReviewItem>(
      `SELECT id, name, role, quote, image, "isPublished", "sortOrder", "createdAt", "updatedAt"
       FROM "review"
       WHERE id = $1`,
      [id]
    );
    if (!review) throw new NotFoundException('Review not found');
    return review;
  }

  async findAllEditorialPaginated(page = 1, limit = 10, search?: string) {
    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      whereConditions.push(`(name ILIKE $${params.length} OR role ILIKE $${params.length} OR quote ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int as total FROM "review" ${whereClause}`;
    const countRes = await this.prisma.queryOne<{ total: number }>(countSql, params);
    const total = countRes?.total || 0;

    const dataParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataSql = `
      SELECT id, name, role, quote, image, "isPublished", "sortOrder", "createdAt", "updatedAt"
      FROM "review"
      ${whereClause}
      ORDER BY "sortOrder" ASC, "createdAt" DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const data = await this.prisma.query<ReviewItem>(dataSql, dataParams);
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

  async create(dto: CreateReviewDto): Promise<ReviewItem> {
    const id = `rev-${Date.now()}`;
    const isPublished = dto.isPublished ?? true;
    const sortOrder = dto.sortOrder ?? 0;

    const row = await this.prisma.queryOne<ReviewItem>(
      `INSERT INTO "review" (id, name, role, quote, image, "isPublished", "sortOrder")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, role, quote, image, "isPublished", "sortOrder", "createdAt", "updatedAt"`,
      [
        id,
        dto.name.trim(),
        dto.role?.trim() || null,
        dto.quote.trim(),
        dto.image || null,
        isPublished,
        sortOrder,
      ]
    );

    return row!;
  }

  async update(id: string, dto: UpdateReviewDto): Promise<ReviewItem> {
    const existing = await this.findOne(id);

    if (dto.image !== undefined && dto.image !== existing.image && existing.image) {
      this.uploadsService.deleteFileByUrl(existing.image);
    }

    const name = dto.name !== undefined ? dto.name.trim() : existing.name;
    const role = dto.role !== undefined ? (dto.role ? dto.role.trim() : null) : existing.role;
    const quote = dto.quote !== undefined ? dto.quote.trim() : existing.quote;
    const image = dto.image !== undefined ? dto.image : existing.image;
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : existing.isPublished;
    const sortOrder = dto.sortOrder !== undefined ? dto.sortOrder : existing.sortOrder;

    const row = await this.prisma.queryOne<ReviewItem>(
      `UPDATE "review"
       SET name = $1, role = $2, quote = $3, image = $4, "isPublished" = $5, "sortOrder" = $6, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, name, role, quote, image, "isPublished", "sortOrder", "createdAt", "updatedAt"`,
      [name, role, quote, image, isPublished, sortOrder, id]
    );

    return row!;
  }

  async togglePublish(id: string): Promise<ReviewItem> {
    const existing = await this.findOne(id);
    const updatedStatus = !existing.isPublished;

    const row = await this.prisma.queryOne<ReviewItem>(
      `UPDATE "review"
       SET "isPublished" = $1, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, name, role, quote, image, "isPublished", "sortOrder", "createdAt", "updatedAt"`,
      [updatedStatus, id]
    );

    return row!;
  }

  async remove(id: string) {
    const existing = await this.findOne(id);
    if (existing.image) {
      this.uploadsService.deleteFileByUrl(existing.image);
    }

    await this.prisma.execute(`DELETE FROM "review" WHERE id = $1`, [id]);
    return { success: true, message: 'Review deleted successfully' };
  }
}
