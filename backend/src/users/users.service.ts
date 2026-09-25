import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

export type UserRow = {
  id: string;
  email: string;
  name: string | null;
  phone?: string | null;
  privacyPolicyAccepted?: boolean;
  bio: string | null;
  avatarUrl: string | null;
  role: string;
  isFeatured?: boolean;
  sortOrder?: number;
  isShadowBanned?: boolean;
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
      whereSql = `WHERE email ILIKE $1 OR name ILIKE $1 OR phone ILIKE $1`;
    }

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM "user" ${whereSql}`,
      params,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const queryParams = [...params, limit, offset];
    const data = await this.prisma.query<UserRow>(
      `SELECT id, email, name, 
              COALESCE(NULLIF(phone, ''), '+91 98470 12345') AS phone, 
              COALESCE("privacyPolicyAccepted", true) AS "privacyPolicyAccepted", 
              bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"
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

  async findById(id: string): Promise<UserRow & {
    subscriptionStatus: 'ACTIVE' | 'EXPIRED' | null;
    subscriptionEndDate: string | null;
    isStudent: boolean;
  }> {
    const user = await this.prisma.queryOne<UserRow>(
      `SELECT id, email, name, 
              COALESCE(NULLIF(phone, ''), '+91 98470 12345') AS phone, 
              COALESCE("privacyPolicyAccepted", true) AS "privacyPolicyAccepted", 
              bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"
       FROM "user" WHERE id = $1`,
      [id],
    );
    if (!user) throw new NotFoundException('User not found');

    let sub = await this.prisma.queryOne<{
      status: string;
      endDate: Date;
      isStudent: boolean;
    }>(
      `SELECT status, "endDate", "isStudent" FROM subscription WHERE "userId" = $1`,
      [id],
    );

    // Auto-activate only if no subscription record exists and user has an approved student application
    if (!sub && user.email) {
      const applicationsRow = await this.prisma.queryOne<{ value: any }>(
        `SELECT value FROM site_setting WHERE key = 'student_applications' LIMIT 1`,
      );
      if (applicationsRow?.value && Array.isArray(applicationsRow.value)) {
        const approvedApp = applicationsRow.value.find(
          (app: any) =>
            app.status === 'APPROVED' &&
            app.email &&
            app.email.trim().toLowerCase() === user.email.trim().toLowerCase(),
        );
        if (approvedApp) {
          const endDateVal = approvedApp.endDate ? new Date(approvedApp.endDate) : null;
          const targetEndDate =
            endDateVal && !isNaN(endDateVal.getTime()) ? endDateVal.toISOString() : null;

          if (targetEndDate) {
            sub = await this.prisma.queryOne<{
              status: string;
              endDate: Date;
              isStudent: boolean;
            }>(
              `INSERT INTO subscription (id, "userId", "planType", status, "startDate", "endDate", "isStudent", "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, 'SIX_MONTH', 'ACTIVE', now(), $2::timestamp, true, now(), now())
               ON CONFLICT ("userId") DO UPDATE
                 SET status      = 'ACTIVE',
                     "startDate" = now(),
                     "endDate"   = $2::timestamp,
                     "isStudent" = true,
                     "updatedAt" = now()
               RETURNING status, "endDate", "isStudent"`,
              [id, targetEndDate],
            );
          } else {
            sub = await this.prisma.queryOne<{
              status: string;
              endDate: Date;
              isStudent: boolean;
            }>(
              `INSERT INTO subscription (id, "userId", "planType", status, "startDate", "endDate", "isStudent", "createdAt", "updatedAt")
               VALUES (gen_random_uuid()::text, $1, 'SIX_MONTH', 'ACTIVE', now(), now() + interval '6 months', true, now(), now())
               ON CONFLICT ("userId") DO UPDATE
                 SET status      = 'ACTIVE',
                     "startDate" = now(),
                     "endDate"   = now() + interval '6 months',
                     "isStudent" = true,
                     "updatedAt" = now()
               RETURNING status, "endDate", "isStudent"`,
              [id],
            );
          }
        }
      }
    }

    const subIsActive = sub && sub.status === 'ACTIVE' && new Date(sub.endDate) > new Date();

    return {
      ...user,
      subscriptionStatus: subIsActive ? 'ACTIVE' : (sub ? 'EXPIRED' : null),
      subscriptionEndDate: subIsActive && sub ? new Date(sub.endDate).toISOString() : null,
      isStudent: Boolean(subIsActive && sub?.isStudent),
    };
  }

  async findFeaturedAuthors(pageVal?: number, limitVal?: number) {
    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 4;
    const offset = (page - 1) * limit;

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM "user" WHERE "isFeatured" = true AND ("isShadowBanned" IS NOT TRUE)`
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const data = await this.prisma.query<UserRow>(
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"
       FROM "user"
       WHERE "isFeatured" = true AND ("isShadowBanned" IS NOT TRUE)
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
      `SELECT COUNT(*) AS count FROM "user" WHERE role = 'AUTHOR'::"Role" AND ("isShadowBanned" IS NOT TRUE)`
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const data = await this.prisma.query<UserRow>(
      `SELECT id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"
       FROM "user"
       WHERE role = 'AUTHOR'::"Role" AND ("isShadowBanned" IS NOT TRUE)
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
    if (existing.role !== 'AUTHOR') {
      throw new BadRequestException('Featured status can only be set for authors');
    }
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

  private async shiftAuthorPriorities(targetUserId: string | null, targetPriority: number): Promise<void> {
    if (targetPriority <= 0) return;

    // Check if any other author already has this priority or higher that needs shifting
    const conflictingAuthors = await this.prisma.query<{ id: string; sortOrder: number }>(
      `SELECT id, "sortOrder"
       FROM "user"
       WHERE role = 'AUTHOR'::"Role"
         ${targetUserId ? 'AND id != $1' : ''}
         AND "sortOrder" >= ${targetUserId ? '$2' : '$1'}
       ORDER BY "sortOrder" ASC, "updatedAt" DESC`,
      targetUserId ? [targetUserId, targetPriority] : [targetPriority],
    );

    if (!conflictingAuthors || conflictingAuthors.length === 0) {
      return;
    }

    // Only shift if there is at least one author at targetPriority
    const hasDirectConflict = conflictingAuthors.some((a) => a.sortOrder === targetPriority);
    if (!hasDirectConflict) {
      return;
    }

    // Cascade shift starting from targetPriority + 1
    let nextAvailable = targetPriority + 1;
    for (const author of conflictingAuthors) {
      if (author.sortOrder < nextAvailable) {
        await this.prisma.execute(
          `UPDATE "user" SET "sortOrder" = $1, "updatedAt" = now() WHERE id = $2`,
          [nextAvailable, author.id],
        );
        nextAvailable++;
      } else {
        nextAvailable = author.sortOrder + 1;
      }
    }
  }

  async updateSortOrder(id: string, sortOrder: number): Promise<UserRow> {
    const existing = await this.findById(id);
    if (existing.role !== 'AUTHOR') {
      throw new BadRequestException('Priority order can only be set for authors');
    }
    const val = typeof sortOrder === 'number' ? sortOrder : parseInt(String(sortOrder || '0'), 10);
    const safeSortOrder = isNaN(val) ? 0 : Math.max(0, val);

    if (safeSortOrder > 0) {
      await this.shiftAuthorPriorities(id, safeSortOrder);
    }

    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET "sortOrder" = $1, "updatedAt" = now()
       WHERE id = $2
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"`,
      [safeSortOrder, id],
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async toggleShadowBan(id: string): Promise<UserRow> {
    const existing = await this.findById(id);
    const newStatus = !existing.isShadowBanned;
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user" SET "isShadowBanned" = $1, "updatedAt" = now()
       WHERE id = $2
       RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"`,
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
    const validRoles = ['READER', 'AUTHOR', 'EDITOR', 'MODERATOR'];
    if (!validRoles.includes(newRole)) {
      throw new BadRequestException(`Invalid role: ${newRole}`);
    }
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user"
       SET role = $1::"Role",
           "updatedAt" = now(),
           "isFeatured" = CASE WHEN $1::"Role" != 'AUTHOR'::"Role" THEN false ELSE "isFeatured" END,
           "sortOrder" = CASE WHEN $1::"Role" != 'AUTHOR'::"Role" THEN 0 ELSE "sortOrder" END
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

      const sortVal = typeof dto.sortOrder === 'number' ? dto.sortOrder : parseInt(String(dto.sortOrder || '0'), 10);
      const safeSort = isNaN(sortVal) ? 0 : Math.max(0, sortVal);
      if (safeSort > 0) {
        await this.shiftAuthorPriorities(existing.id, safeSort);
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
         RETURNING id, email, name, bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"`,
        [dto.name || null, dto.bio || null, dto.avatarUrl || null, dto.isFeatured ?? null, safeSort, existing.id],
      );
      return updated!;
    }

    const nameVal = dto.name.trim();
    const phoneVal = dto.phone?.trim() || `+91 98470 ${Math.floor(1000 + Math.random() * 9000)}`;
    const privacyVal = dto.privacyPolicyAccepted ?? true;
    const bioVal = dto.bio?.trim() || null;
    const avatarVal = dto.avatarUrl?.trim() || null;
    const isFeaturedVal = dto.isFeatured ?? false;
    const rawSortOrder = typeof dto.sortOrder === 'number' ? dto.sortOrder : parseInt(String(dto.sortOrder || '0'), 10);
    const sortOrderVal = isNaN(rawSortOrder) ? 0 : Math.max(0, rawSortOrder);

    if (sortOrderVal > 0) {
      await this.shiftAuthorPriorities(null, sortOrderVal);
    }

    const user = await this.prisma.queryOne<UserRow>(
      `INSERT INTO "user" (id, email, name, phone, "privacyPolicyAccepted", bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, 'AUTHOR'::"Role", $7, $8, false, now(), now())
       RETURNING id, email, name, phone, "privacyPolicyAccepted", bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"`,
      [emailVal, nameVal, phoneVal, privacyVal, bioVal, avatarVal, isFeaturedVal, sortOrderVal],
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

    if (dto.phone !== undefined) {
      params.push(dto.phone ? dto.phone.trim() : null);
      updates.push(`phone = $${params.length}`);
    }

    if (dto.privacyPolicyAccepted !== undefined) {
      params.push(dto.privacyPolicyAccepted);
      updates.push(`"privacyPolicyAccepted" = $${params.length}`);
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
      const validRoles = ['READER', 'AUTHOR', 'EDITOR', 'MODERATOR'];
      if (!validRoles.includes(dto.role)) {
        throw new BadRequestException(`Invalid role: ${dto.role}`);
      }
      params.push(dto.role);
      updates.push(`role = $${params.length}::"Role"`);
    }

    const finalRole = dto.role !== undefined ? dto.role : existing.role;
    if (finalRole !== 'AUTHOR') {
      updates.push(`"isFeatured" = false`);
      updates.push(`"sortOrder" = 0`);
    } else {
      if (dto.isFeatured !== undefined) {
        params.push(dto.isFeatured);
        updates.push(`"isFeatured" = $${params.length}`);
      }

      if (dto.sortOrder !== undefined) {
        const sortVal = typeof dto.sortOrder === 'number' ? dto.sortOrder : parseInt(String(dto.sortOrder), 10);
        const safeSort = isNaN(sortVal) ? 0 : Math.max(0, sortVal);
        if (safeSort > 0) {
          await this.shiftAuthorPriorities(id, safeSort);
        }
        params.push(safeSort);
        updates.push(`"sortOrder" = $${params.length}`);
      }
    }

    if (dto.isShadowBanned !== undefined) {
      params.push(Boolean(dto.isShadowBanned));
      updates.push(`"isShadowBanned" = $${params.length}`);
    }

    params.push(id);
    const user = await this.prisma.queryOne<UserRow>(
      `UPDATE "user"
       SET ${updates.join(', ')}
       WHERE id = $${params.length}
       RETURNING id, email, name, phone, "privacyPolicyAccepted", bio, "avatarUrl", role, "isFeatured", "sortOrder", "isShadowBanned", "createdAt"`,
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

