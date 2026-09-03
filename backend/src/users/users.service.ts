import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  isFeatured?: boolean;
  sortOrder?: number;
  createdAt?: string;
};

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private uploadsService: UploadsService,
  ) {}

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
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"
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
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"
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
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"
       FROM "user"
       WHERE "isFeatured" = true
       ORDER BY CASE WHEN "sortOrder" > 0 THEN 0 ELSE 1 END ASC, "sortOrder" ASC, "updatedAt" DESC
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
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"
       FROM "user"
       WHERE role = 'AUTHOR'::"Role"
       ORDER BY CASE WHEN "sortOrder" > 0 THEN 0 ELSE 1 END ASC, "sortOrder" ASC, "createdAt" DESC
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
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"`,
      [newStatus, id],
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateSortOrder(id: string, sortOrder: number): Promise<UserRow> {
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET "sortOrder" = $1, "updatedAt" = now()
       WHERE id = $2
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"`,
      [sortOrder, id],
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto): Promise<UserRow> {
    if (dto.name !== undefined && dto.bio !== undefined) {
      const user = await this.prisma.queryOne<UserRow>(
        `UPDATE "user" SET name = $1, bio = $2, "updatedAt" = now()
         WHERE id = $3
         RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder"`,
        [dto.name, dto.bio, id],
      );
      return user!;
    } else if (dto.name !== undefined) {
      const user = await this.prisma.queryOne<UserRow>(
        `UPDATE "user" SET name = $1, "updatedAt" = now()
         WHERE id = $2
         RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder"`,
        [dto.name, id],
      );
      return user!;
    } else if (dto.bio !== undefined) {
      const user = await this.prisma.queryOne<UserRow>(
        `UPDATE "user" SET bio = $1, "updatedAt" = now()
         WHERE id = $2
         RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder"`,
        [dto.bio, id],
      );
      return user!;
    }
    return this.findById(id);
  }

  async updateAvatar(id: string, avatarUrl: string): Promise<UserRow> {
    const existing = await this.findById(id);
    if (existing.avatarUrl && existing.avatarUrl !== avatarUrl) {
      this.uploadsService.deleteFileByUrl(existing.avatarUrl);
    }

    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET "avatarUrl" = $1, "updatedAt" = now()
       WHERE id = $2
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder"`,
      [avatarUrl, id],
    );
    return user!;
  }

  async becomeAuthor(id: string): Promise<UserRow> {
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET role = CASE WHEN role = 'READER'::"Role" THEN 'AUTHOR'::"Role" ELSE role END, "updatedAt" = now()
       WHERE id = $1
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder"`,
      [id],
    );
    return user!;
  }

  async updateRole(id: string, newRole: string): Promise<UserRow> {
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET role = $1::"Role", "updatedAt" = now()
       WHERE id = $2
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder"`,
      [newRole, id],
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createAuthorByAdmin(dto: any): Promise<UserRow> {
    const emailVal = dto.email.toLowerCase().trim();
    const existing = await this.prisma.queryOne<UserRow>(
      `SELECT id, "avatarUrl" FROM "user" WHERE LOWER(email) = LOWER($1) LIMIT 1`,
      [emailVal],
    );

    if (existing) {
      if (dto.avatarUrl && existing.avatarUrl && existing.avatarUrl !== dto.avatarUrl) {
        this.uploadsService.deleteFileByUrl(existing.avatarUrl);
      }

      const updated = await this.prisma.queryOne<UserRow>(
        `UPDATE "user"
         SET role = 'AUTHOR'::"Role",
             name = COALESCE($1, name),
             bio = COALESCE($2, bio),
             "avatarUrl" = COALESCE($3, "avatarUrl"),
             "isFeatured" = COALESCE($4, "isFeatured"),
             "sortOrder" = COALESCE($5, "sortOrder"),
             "updatedAt" = now()
         WHERE id = $6
         RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"`,
        [dto.name || null, dto.bio || null, dto.avatarUrl || null, dto.isFeatured ?? null, dto.sortOrder ?? 0, existing.id],
      );
      return updated!;
    }

    const nameVal = dto.name.trim();
    const bioVal = dto.bio?.trim() || null;
    const avatarVal = dto.avatarUrl?.trim() || null;
    const isFeaturedVal = dto.isFeatured ?? false;
    const sortOrderVal = dto.sortOrder ?? 0;

    const user = await this.prisma.queryOne<UserRow>(
      `INSERT INTO "user" (id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'AUTHOR'::"Role", $5, $6, now(), now())
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"`,
      [emailVal, nameVal, bioVal, avatarVal, isFeaturedVal, sortOrderVal],
    );

    return user!;
  }

  async deleteUser(id: string) {
    const user = await this.findById(id);
    if (user.avatarUrl) {
      this.uploadsService.deleteFileByUrl(user.avatarUrl);
    }
    await this.prisma.execute(`DELETE FROM "user" WHERE id = $1`, [id]);
    return { success: true, message: 'User deleted successfully' };
  }
}

