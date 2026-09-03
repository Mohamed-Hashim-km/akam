import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  isFeatured?: boolean;
  createdAt?: string;
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(pageVal?: number, limitVal?: number, search?: string) {
    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 10;
    const offset = (page - 1) * limit;

    let whereSql = '';
    const params: any[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereSql = `WHERE email ILIKE $1 OR name ILIKE $1`;
    }

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM "user" ${whereSql}`,
      params,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const queryParams = [...params, limit, offset];
    const data = await this.prisma.query<UserRow>(
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "createdAt"
       FROM "user"
       ${whereSql}
       ORDER BY "createdAt" DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams,
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

  async findById(id: string): Promise<UserRow> {
    const user = await this.prisma.queryOne<UserRow>(
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "createdAt"
       FROM "user" WHERE id = $1`,
      [id],
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findFeaturedAuthors(pageVal?: number, limitVal?: number) {
    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 4;
    const offset = (page - 1) * limit;

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM "user" WHERE "isFeatured" = true`
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const data = await this.prisma.query<UserRow>(
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "createdAt"
       FROM "user"
       WHERE "isFeatured" = true
       ORDER BY "updatedAt" DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
      },
    };
  }

  async findPublicAuthors(pageVal?: number, limitVal?: number) {
    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 4;
    const offset = (page - 1) * limit;

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM "user" WHERE role = 'AUTHOR'::"Role"`
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const data = await this.prisma.query<UserRow>(
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "createdAt"
       FROM "user"
       WHERE role = 'AUTHOR'::"Role"
       ORDER BY "createdAt" DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );

    const totalPages = Math.ceil(total / limit) || 1;
    const hasMore = page < totalPages;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasMore,
      },
    };
  }

  async toggleFeatured(id: string): Promise<UserRow> {
    const existing = await this.findById(id);
    const newStatus = !existing.isFeatured;
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET "isFeatured" = $1, "updatedAt" = now()
       WHERE id = $2
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "createdAt"`,
      [newStatus, id],
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserRow> {
    if (dto.name !== undefined && dto.bio !== undefined) {
      const user = await this.prisma.queryOne<UserRow>(
        `UPDATE "user" SET name = $1, bio = $2, "updatedAt" = now()
         WHERE id = $3
         RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured"`,
        [dto.name, dto.bio, id],
      );
      return user!;
    } else if (dto.name !== undefined) {
      const user = await this.prisma.queryOne<UserRow>(
        `UPDATE "user" SET name = $1, "updatedAt" = now()
         WHERE id = $2
         RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured"`,
        [dto.name, id],
      );
      return user!;
    } else if (dto.bio !== undefined) {
      const user = await this.prisma.queryOne<UserRow>(
        `UPDATE "user" SET bio = $1, "updatedAt" = now()
         WHERE id = $2
         RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured"`,
        [dto.bio, id],
      );
      return user!;
    }
    return this.findById(id);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<UserRow> {
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET "avatarUrl" = $1, "updatedAt" = now()
       WHERE id = $2
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured"`,
      [avatarUrl, id],
    );
    return user!;
  }

  async becomeAuthor(id: string): Promise<UserRow> {
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET role = CASE WHEN role = 'READER'::"Role" THEN 'AUTHOR'::"Role" ELSE role END, "updatedAt" = now()
       WHERE id = $1
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured"`,
      [id],
    );
    return user!;
  }

  async updateRole(id: string, newRole: string): Promise<UserRow> {
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET role = $1::"Role", "updatedAt" = now()
       WHERE id = $2
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured"`,
      [newRole, id],
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
