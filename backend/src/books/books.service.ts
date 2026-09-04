import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';

export interface BookReleaseItem {
  id: string;
  title: string;
  author: string;
  editionTag: string | null;
  description: string;
  coverImage: string | null;
  preorderLink: string | null;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class BooksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllPublished(): Promise<BookReleaseItem[]> {
    return this.prisma.query<BookReleaseItem>(
      `SELECT id, title, author, "editionTag", description, "coverImage", "preorderLink", "isPublished", "createdAt", "updatedAt"
       FROM "book_release"
       WHERE "isPublished" = true
       ORDER BY "createdAt" DESC`
    );
  }

  async findOne(id: string): Promise<BookReleaseItem> {
    const book = await this.prisma.queryOne<BookReleaseItem>(
      `SELECT id, title, author, "editionTag", description, "coverImage", "preorderLink", "isPublished", "createdAt", "updatedAt"
       FROM "book_release"
       WHERE id = $1`,
      [id]
    );
    if (!book) throw new NotFoundException('Book release not found');
    return book;
  }

  async findAllEditorialPaginated(page = 1, limit = 10, search?: string) {
    const offset = (page - 1) * limit;
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (search && search.trim() !== '') {
      params.push(`%${search.trim()}%`);
      whereConditions.push(`(title ILIKE $${params.length} OR author ILIKE $${params.length} OR description ILIKE $${params.length})`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::int as total FROM "book_release" ${whereClause}`;
    const countRes = await this.prisma.queryOne<{ total: number }>(countSql, params);
    const total = countRes?.total || 0;

    const dataParams = [...params, limit, offset];
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataSql = `
      SELECT id, title, author, "editionTag", description, "coverImage", "preorderLink", "isPublished", "createdAt", "updatedAt"
      FROM "book_release"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${limitIdx} OFFSET $${offsetIdx}
    `;

    const data = await this.prisma.query<BookReleaseItem>(dataSql, dataParams);
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

  async create(dto: CreateBookDto): Promise<BookReleaseItem> {
    const id = `book-${Date.now()}`;
    const isPublished = dto.isPublished ?? true;

    const row = await this.prisma.queryOne<BookReleaseItem>(
      `INSERT INTO "book_release" (id, title, author, "editionTag", description, "coverImage", "preorderLink", "isPublished")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, author, "editionTag", description, "coverImage", "preorderLink", "isPublished", "createdAt", "updatedAt"`,
      [
        id,
        dto.title,
        dto.author,
        dto.editionTag || 'Print Edition',
        dto.description,
        dto.coverImage || null,
        dto.preorderLink || null,
        isPublished,
      ]
    );

    return row!;
  }

  async update(id: string, dto: UpdateBookDto): Promise<BookReleaseItem> {
    const existing = await this.findOne(id);

    const title = dto.title ?? existing.title;
    const author = dto.author ?? existing.author;
    const editionTag = dto.editionTag !== undefined ? dto.editionTag : existing.editionTag;
    const description = dto.description ?? existing.description;
    const coverImage = dto.coverImage !== undefined ? dto.coverImage : existing.coverImage;
    const preorderLink = dto.preorderLink !== undefined ? dto.preorderLink : existing.preorderLink;
    const isPublished = dto.isPublished !== undefined ? dto.isPublished : existing.isPublished;

    const row = await this.prisma.queryOne<BookReleaseItem>(
      `UPDATE "book_release"
       SET title = $1, author = $2, "editionTag" = $3, description = $4, "coverImage" = $5, "preorderLink" = $6, "isPublished" = $7, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, title, author, "editionTag", description, "coverImage", "preorderLink", "isPublished", "createdAt", "updatedAt"`,
      [title, author, editionTag, description, coverImage, preorderLink, isPublished, id]
    );

    return row!;
  }

  async togglePublish(id: string): Promise<BookReleaseItem> {
    const existing = await this.findOne(id);
    const updatedStatus = !existing.isPublished;

    const row = await this.prisma.queryOne<BookReleaseItem>(
      `UPDATE "book_release"
       SET "isPublished" = $1, "updatedAt" = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, title, author, "editionTag", description, "coverImage", "preorderLink", "isPublished", "createdAt", "updatedAt"`,
      [updatedStatus, id]
    );

    return row!;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.execute(`DELETE FROM "book_release" WHERE id = $1`, [id]);
    return { success: true, message: 'Book release deleted successfully' };
  }
}
