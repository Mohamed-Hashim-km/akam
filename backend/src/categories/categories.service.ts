import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';

export type CategoryRow = {
  id: string;
  name: string;
  malName: string | null;
  description: string | null;
  createdAt: string;
};

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(pageVal?: number, limitVal?: number) {
    if (!pageVal && !limitVal) {
      return this.prisma.query<CategoryRow>(
        `SELECT id, name, "malName", description, "createdAt"
         FROM category
         ORDER BY name ASC`,
      );
    }

    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 10;
    const offset = (page - 1) * limit;

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM category`,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const data = await this.prisma.query<CategoryRow>(
      `SELECT id, name, "malName", description, "createdAt"
       FROM category
       ORDER BY name ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
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
      `INSERT INTO category (id, name, "malName", description, "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, now())
       RETURNING id, name, "malName", description, "createdAt"`,
      [dto.name.trim(), dto.malName?.trim() ?? null, dto.description?.trim() ?? null],
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
