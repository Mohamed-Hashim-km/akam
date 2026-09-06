import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

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
    const validRoles = ['READER', 'AUTHOR', 'EDITOR'];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(`Invalid role: ${newRole}`);
    }
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

  async updateUser(id: string, dto: UpdateUserDto): Promise<UserRow> {
    const existing = await this.findById(id);

    if (dto.email && dto.email.toLowerCase().trim() !== existing.email.toLowerCase().trim()) {
      const emailConflict = await this.prisma.queryOne<UserRow>(
        `SELECT id FROM "user" WHERE LOWER(email) = LOWER($1) AND id != $2 LIMIT 1`,
        [dto.email.trim(), id],
      );
      if (emailConflict) {
        throw new BadRequestException('Email address is already in use by another account');
      }
    }

    if (dto.avatarUrl !== undefined && existing.avatarUrl && existing.avatarUrl !== dto.avatarUrl) {
      this.uploadsService.deleteFileByUrl(existing.avatarUrl);
    }

    const updates: string[] = ['"updatedAt" = now()'];
    const params: any[] = [];

    if (dto.name !== undefined) {
      params.push(dto.name.trim());
      updates.push(`name = $${params.length}`);
    }

    if (dto.email !== undefined) {
      params.push(dto.email.toLowerCase().trim());
      updates.push(`email = $${params.length}`);
    }

    if (dto.bio !== undefined) {
      params.push(dto.bio ? dto.bio.trim() : null);
      updates.push(`bio = $${params.length}`);
    }

    if (dto.avatarUrl !== undefined) {
      params.push(dto.avatarUrl ? dto.avatarUrl.trim() : null);
      updates.push(`"avatarUrl" = $${params.length}`);
    }

    if (dto.role !== undefined) {
      const validRoles = ['READER', 'AUTHOR', 'EDITOR'];
      if (!validRoles.includes(dto.role)) {
        throw new BadRequestException(`Invalid role: ${dto.role}`);
      }
      params.push(dto.role);
      updates.push(`role = $${params.length}::"Role"`);
    }

    if (dto.isFeatured !== undefined) {
      params.push(dto.isFeatured);
      updates.push(`"isFeatured" = $${params.length}`);
    }

    if (dto.sortOrder !== undefined) {
      const sortVal = typeof dto.sortOrder === 'number' ? dto.sortOrder : parseInt(String(dto.sortOrder), 10);
      params.push(isNaN(sortVal) ? 0 : sortVal);
      updates.push(`"sortOrder" = $${params.length}`);
    }

    params.push(id);
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user"
       SET ${updates.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "createdAt"`,
      params,
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async deleteUser(id: string) {
    const user = await this.findById(id);
    if (user.avatarUrl) {
      this.uploadsService.deleteFileByUrl(user.avatarUrl);
    }

    // Clean up author's stories cover images and inline media if any
    try {
      const stories = await this.prisma.query<{ coverImageUrl: string | null; content: string }>(
        `SELECT "coverImageUrl", content FROM "Story" WHERE "authorId" = $1`,
        [id],
      ).catch(async () => {
        return await this.prisma.query<{ coverImageUrl: string | null; content: string }>(
          `SELECT "coverImageUrl", content FROM story WHERE "authorId" = $1`,
          [id],
        );
      });
      for (const s of stories) {
        if (s.coverImageUrl) this.uploadsService.deleteFileByUrl(s.coverImageUrl);
        if (s.content) this.uploadsService.deleteFilesFromContent(s.content);
      }
    } catch {
      // Safe fallback if story table is empty
    }

    // Unlink any optional author/user references
    try {
      await this.prisma.execute(`UPDATE community_post SET "lockedById" = NULL WHERE "lockedById" = $1`, [id]);
      await this.prisma.execute(`UPDATE community_comment SET "removedById" = NULL WHERE "removedById" = $1`, [id]);
      await this.prisma.execute(`UPDATE community_report SET "reviewedById" = NULL WHERE "reviewedById" = $1`, [id]);
    } catch {}

    await this.prisma.execute(`DELETE FROM "user" WHERE id = $1`, [id]);
    return { success: true, message: 'User deleted successfully' };
  }
}

