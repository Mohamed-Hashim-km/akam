import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { CreateStoryDto } from './dto/create-story.dto.js';
import { UpdateStoryDto } from './dto/update-story.dto.js';
import { ReviewStoryDto } from './dto/review-story.dto.js';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

type StoryRow = {
  id: string;
  title: string;
  slug: string;
  content?: string;
  category?: string;
  coverImageUrl: string | null;
  status: string;
  rejectionNote?: string | null;
  authorId: string;
  authorName?: string | null;
  authorEmail?: string;
  authorAvatarUrl?: string | null;
  authorBio?: string | null;
  createdAt: string;
  updatedAt?: string;
};

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private uploadsService: UploadsService,
  ) {}

  async findAll(
    status?: string,
    pageVal?: number,
    limitVal?: number,
    search?: string,
    category?: string,
    authorId?: string,
  ) {
    const storyStatus = status ?? 'APPROVED';
    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 10;
    const offset = (page - 1) * limit;

    let whereSql = `WHERE s.status = $1::"StoryStatus"`;
    const params: any[] = [storyStatus];

    if (authorId && authorId.trim()) {
      params.push(authorId.trim());
      whereSql += ` AND s."authorId" = $${params.length}`;
    }

    if (category && category.trim() && category.toLowerCase() !== 'all') {
      params.push(category.trim());
      whereSql += ` AND LOWER(s.category) = LOWER($${params.length})`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereSql += ` AND (s.title ILIKE $${params.length} OR u.name ILIKE $${params.length} OR s.category ILIKE $${params.length})`;
    }

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM story s
       JOIN "user" u ON u.id = s."authorId"
       ${whereSql}`,
      params,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const queryParams = [...params, limit, offset];
    const data = await this.prisma.query<StoryRow>(
      `SELECT
         s.id, s.title, s.slug, s.content, s.category, s."coverImageUrl", s.status, s."createdAt",
         s."authorId",
         u.name AS "authorName",
         u."avatarUrl" AS "authorAvatarUrl"
       FROM story s
       JOIN "user" u ON u.id = s."authorId"
       ${whereSql}
       ORDER BY s."createdAt" DESC
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

  async findOne(idOrSlug: string): Promise<StoryRow> {
    const story = await this.prisma.queryOne<StoryRow>(
      `SELECT
         s.id, s.title, s.slug, s.content, s.category, s."coverImageUrl", s.status,
         s."rejectionNote", s."createdAt", s."updatedAt",
         s."authorId",
         u.name AS "authorName",
         u."avatarUrl" AS "authorAvatarUrl",
         u.bio AS "authorBio"
       FROM story s
       JOIN "user" u ON u.id = s."authorId"
       WHERE s.id = $1 OR s.slug = $1
       LIMIT 1`,
      [idOrSlug],
    );
    if (!story) throw new NotFoundException('Story not found');
    return story;
  }

  async getAuthorStories(authorId: string): Promise<StoryRow[]> {
    return this.prisma.query<StoryRow>(
      `SELECT id, title, slug, category, "coverImageUrl", status, "createdAt", "updatedAt"
       FROM story WHERE "authorId" = $1 ORDER BY "updatedAt" DESC`,
      [authorId],
    );
  }

  async create(authorId: string, dto: CreateStoryDto): Promise<StoryRow> {
    const userRow = await this.prisma.queryOne<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [authorId],
    );
    if (!userRow || !['AUTHOR', 'EDITOR', 'ADMIN'].includes(userRow.role)) {
      throw new ForbiddenException(
        'You must be an author to create stories. Upgrade your account first.',
      );
    }

    const isEditorOrAdmin = ['EDITOR', 'ADMIN'].includes(userRow.role);
    const targetAuthorId =
      dto.authorId && isEditorOrAdmin
        ? dto.authorId
        : authorId;

    const initialStatus =
      dto.status && isEditorOrAdmin && ['APPROVED', 'PENDING', 'DRAFT'].includes(dto.status)
        ? dto.status
        : 'DRAFT';

    const baseSlug = slugify(dto.title);
    let slug = baseSlug;
    let counter = 0;
    while (true) {
      const existing = await this.prisma.queryOne<{ id: string }>(
        `SELECT id FROM story WHERE slug = $1 LIMIT 1`,
        [slug],
      );
      if (!existing) break;
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const categoryVal = dto.category?.trim() || 'Fiction';

    const story = await this.prisma.queryOne<StoryRow>(
      `INSERT INTO story (id, title, slug, content, category, status, "authorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5::"StoryStatus", $6, now(), now())
       RETURNING id, title, slug, category, status, "createdAt"`,
      [dto.title, slug, dto.content, categoryVal, initialStatus, targetAuthorId],
    );

    return story!;
  }

  async update(id: string, authorId: string, dto: UpdateStoryDto): Promise<StoryRow> {
    const story = await this.findOne(id);
    if (story.authorId !== authorId) throw new ForbiddenException('Not your story');
    if (!['DRAFT', 'REJECTED'].includes(story.status)) {
      throw new BadRequestException('Only DRAFT or REJECTED stories can be edited');
    }

    const updates: string[] = ['"updatedAt" = now()'];
    const params: any[] = [];

    if (dto.title !== undefined) {
      params.push(dto.title);
      updates.push(`title = $${params.length}`);
    }
    if (dto.content !== undefined) {
      params.push(dto.content);
      updates.push(`content = $${params.length}`);
    }
    if (dto.category !== undefined) {
      params.push(dto.category);
      updates.push(`category = $${params.length}`);
    }

    params.push(id);
    const idParamIndex = params.length;

    return (await this.prisma.queryOne<StoryRow>(
      `UPDATE story SET ${updates.join(', ')}
       WHERE id = $${idParamIndex}
       RETURNING id, title, slug, category, status, "updatedAt"`,
      params,
    ))!;
  }

  async submitForReview(id: string, authorId: string): Promise<{ id: string; status: string }> {
    const story = await this.findOne(id);
    if (story.authorId !== authorId) throw new ForbiddenException('Not your story');
    if (!['DRAFT', 'REJECTED'].includes(story.status)) {
      throw new BadRequestException('Only DRAFT or REJECTED stories can be submitted');
    }
    if (!story.coverImageUrl) {
      throw new BadRequestException('A cover image is required before submitting your story for editorial review');
    }

    await this.prisma.execute(
      `UPDATE story SET status = 'PENDING'::"StoryStatus", "rejectionNote" = null, "updatedAt" = now()
       WHERE id = $1`,
      [id],
    );

    await this.notificationsService.notifyEditorsOfSubmission(story.title, id);

    return { id, status: 'PENDING' };
  }

  async uploadCover(id: string, userId: string, coverImageUrl: string) {
    const story = await this.findOne(id);
    const userRow = await this.prisma.queryOne<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [userId],
    );
    const isEditorOrAdmin = userRow && ['EDITOR', 'ADMIN'].includes(userRow.role);
    if (story.authorId !== userId && !isEditorOrAdmin) throw new ForbiddenException('Not authorized');

    if (story.coverImageUrl && story.coverImageUrl !== coverImageUrl) {
      this.uploadsService.deleteFileByUrl(story.coverImageUrl);
    }

    return this.prisma.queryOne(
      `UPDATE story SET "coverImageUrl" = $1, "updatedAt" = now()
       WHERE id = $2 RETURNING id, "coverImageUrl"`,
      [coverImageUrl, id],
    );
  }

  async getPendingQueue(pageVal?: number, limitVal?: number, search?: string) {
    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 10;
    const offset = (page - 1) * limit;

    let whereSql = `WHERE s.status = 'PENDING'::"StoryStatus"`;
    const params: any[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      whereSql += ` AND (s.title ILIKE $1 OR u.name ILIKE $1 OR u.email ILIKE $1 OR s.category ILIKE $1)`;
    }

    const countRow = await this.prisma.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count
       FROM story s
       JOIN "user" u ON u.id = s."authorId"
       ${whereSql}`,
      params,
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    const queryParams = [...params, limit, offset];
    const data = await this.prisma.query<StoryRow>(
      `SELECT
         s.id, s.title, s.slug, s.content, s.category, s."coverImageUrl", s.status, s."rejectionNote", s."createdAt", s."updatedAt",
         s."authorId",
         u.name AS "authorName",
         u.email AS "authorEmail"
       FROM story s
       JOIN "user" u ON u.id = s."authorId"
       ${whereSql}
       ORDER BY s."createdAt" ASC
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

  async reviewStory(id: string, reviewerId: string, dto: ReviewStoryDto) {
    const story = await this.findOne(id);
    if (story.status === 'DRAFT') {
      throw new BadRequestException('Draft stories cannot be reviewed until submitted');
    }

    const reviewer = await this.prisma.queryOne<{ role: string }>(
      `SELECT role FROM "user" WHERE id = $1`,
      [reviewerId],
    );
    if (!reviewer || !['EDITOR', 'ADMIN'].includes(reviewer.role)) {
      throw new ForbiddenException('Only EDITOR or ADMIN can review stories');
    }

    if (dto.decision === 'APPROVED') {
      await this.prisma.execute(
        `UPDATE story SET status = 'APPROVED'::"StoryStatus", "rejectionNote" = null, "updatedAt" = now()
         WHERE id = $1`,
        [id],
      );
      await this.notificationsService.notifyAuthorOfApproval(
        story.authorId,
        story.title,
        id,
      );
      return { id, status: 'APPROVED' };
    } else {
      await this.prisma.execute(
        `UPDATE story SET status = 'REJECTED'::"StoryStatus", "rejectionNote" = $1, "updatedAt" = now()
         WHERE id = $2`,
        [dto.rejectionNote ?? null, id],
      );
      await this.notificationsService.notifyAuthorOfRejection(
        story.authorId,
        story.title,
        id,
        dto.rejectionNote,
      );
      return { id, status: 'REJECTED', rejectionNote: dto.rejectionNote };
    }
  }

  async delete(id: string, userId: string, userRole: string) {
    const story = await this.findOne(id);
    if (story.authorId !== userId && !['EDITOR', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Not authorized to delete this story');
    }
    if (story.coverImageUrl) {
      this.uploadsService.deleteFileByUrl(story.coverImageUrl);
    }
    if (story.content) {
      this.uploadsService.deleteFilesFromContent(story.content);
    }
    // Clean up dependent child records if present
    await this.prisma.execute(`DELETE FROM story_report WHERE "storyId" = $1`, [id]).catch(() => null);
    await this.prisma.execute(`DELETE FROM story_comment WHERE "storyId" = $1`, [id]).catch(() => null);
    await this.prisma.execute(`DELETE FROM story_bookmark WHERE "storyId" = $1`, [id]).catch(() => null);
    await this.prisma.execute(`DELETE FROM story_like WHERE "storyId" = $1`, [id]).catch(() => null);
    await this.prisma.execute(`DELETE FROM story WHERE id = $1`, [id]);
    return { success: true };
  }
}
