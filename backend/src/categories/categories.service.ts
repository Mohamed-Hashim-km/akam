import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

export type CategoryRow = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  workCount?: number;
};

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(pageVal?: number, limitVal?: number, search?: string) {
    const trimmedSearch = search?.trim();
    const searchFilter = trimmedSearch
      ? `WHERE LOWER(c.name) LIKE LOWER($1) OR LOWER(COALESCE(c.description, '')) LIKE LOWER($1)`
      : '';
    const searchParam = trimmedSearch ? [`%${trimmedSearch}%`] : [];

    if (!pageVal && !limitVal) {
      return this.prisma.query<CategoryRow>(
        `SELECT c.id, c.name, c.description, c."createdAt",
                (SELECT COUNT(*)::int FROM story s WHERE LOWER(s.category) = LOWER(c.name) AND s.status = 'APPROVED') AS "workCount"
         FROM category c
         ${searchFilter}
         ORDER BY c.name ASC`,
        searchParam,
      );
    }

    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 10;
    const offset = (page - 1) * limit;

    const countSql = searchFilter
      ? `SELECT COUNT(*) AS count FROM category c ${searchFilter}`
      : `SELECT COUNT(*) AS count FROM category`;
    const countRow = await this.prisma.queryOne<{ count: string }>(
      countSql,
      searchParam,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const querySql = `
      SELECT c.id, c.name, c.description, c."createdAt",
             (SELECT COUNT(*)::int FROM story s WHERE LOWER(s.category) = LOWER(c.name) AND s.status = 'APPROVED') AS "workCount"
      FROM category c
      ${searchFilter}
      ORDER BY c.name ASC
      LIMIT $${searchParam.length + 1} OFFSET $${searchParam.length + 2}
    `;

    const data = await this.prisma.query<CategoryRow>(
      querySql,
      [...searchParam, limit, offset],
    );

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async create(dto: CreateCategoryDto): Promise<CategoryRow> {
    const existing = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM category WHERE LOWER(name) = LOWER($1) LIMIT 1`,
      [dto.name.trim()],
    );
    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    const cat = await this.prisma.queryOne<CategoryRow>(
      `INSERT INTO category (id, name, description, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, now())
       RETURNING id, name, description, "createdAt"`,
      [dto.name.trim(), dto.description?.trim() ?? null],
    );
    return cat!;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const count = await this.prisma.execute(
      `DELETE FROM category WHERE id = $1`,
      [id],
    );
    if (count === 0) {
      throw new NotFoundException('Category not found');
    }
    return { success: true };
  }
}
