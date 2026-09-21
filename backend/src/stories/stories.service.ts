import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
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
  description?: string | null;
  content?: string;
  category?: string;
  coverImageUrl: string | null;
  submissionType?: string;
  mediaUrl?: string | null;
  status: string;
  isFeatured?: boolean;
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
  private readonly logger = new Logger(StoriesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private uploadsService: UploadsService,
    private configService: ConfigService,
    @Optional() private subscriptionService?: SubscriptionService,
  ) {}

  private getTransporter(): nodemailer.Transporter {
    const host = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = parseInt(this.configService.get<string>('SMTP_PORT') || '587', 10);
    const secureConfig = this.configService.get<string>('SMTP_SECURE');
    const secure = secureConfig !== undefined ? secureConfig === 'true' : port === 465;
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      family: 4,
    } as any);
  }

  private async sendStoryPublishedEmail(story: StoryRow, type: 'EMAGAZINE' | 'WEB'): Promise<boolean> {
    const email = story.authorEmail;
    if (!email) {
      this.logger.warn(`No email found for author of story ${story.id}`);
      return false;
    }

    const authorName = story.authorName || 'Author';
    const isEmagazine = type === 'EMAGAZINE';
    const subject = isEmagazine
      ? `🎉 Your submission "${story.title}" is published in the AKAM E-Magazine!`
      : `🎉 Your story "${story.title}" has been published on AKAM Digital!`;

    const messageHeading = isEmagazine
      ? 'Published in AKAM E-Magazine Edition!'
      : 'Published on AKAM Digital Works Catalog!';

    const messageBody = isEmagazine
      ? `We are delighted to inform you that your curated submission <strong>"${story.title}"</strong> has been officially published in the AKAM Digital E-Magazine edition.`
      : `We are pleased to inform you that your story <strong>"${story.title}"</strong> has been approved and published to the live public works catalog on AKAM Digital.`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f7f7; margin: 0; padding: 30px 10px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
    .header { background: #040706; padding: 30px; text-align: center; }
    .badge { display: inline-block; background: #E4F953; color: #040706; font-size: 11px; font-weight: bold; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 12px; text-transform: uppercase; margin-bottom: 12px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; font-weight: 700; }
    .content { padding: 36px 30px; color: #333333; line-height: 1.6; }
    .content p { margin: 0 0 16px; font-size: 15px; }
    .highlight-card { background: #fbfbfb; border: 1px solid #eee; border-left: 4px solid #E4F953; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
    .highlight-title { font-size: 17px; font-weight: bold; color: #111; margin-bottom: 6px; }
    .highlight-meta { font-size: 13px; color: #777; }
    .btn { display: inline-block; background: #040706; color: #ffffff !important; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 12px; margin-top: 10px; }
    .footer { padding: 20px 30px 30px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #f0f0f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">${isEmagazine ? 'E-Magazine Edition' : 'Live Publication'}</div>
      <h1>${messageHeading}</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${authorName}</strong>,</p>
      <p>${messageBody}</p>
      
      <div class="highlight-card">
        <div class="highlight-title">${story.title}</div>
        <div class="highlight-meta">Category: ${story.category || 'General'} • Format: ${story.submissionType || 'Story'}</div>
      </div>

      <p>Thank you for contributing to AKAM Digital and sharing your creative voice with our reader community.</p>
      
      <div style="text-align: center; margin-top: 25px;">
        <a href="https://akamdigital.vercel.app/profile" class="btn">View on Your Profile</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} AKAM Digital • Editorial Desk</p>
    </div>
  </div>
</body>
</html>
    `;

    // 1. Try ZeptoMail
    const zeptoToken =
      this.configService.get<string>('ZEPTOMAIL_TOKEN') ||
      this.configService.get<string>('ZEPTO_API_KEY');

    if (zeptoToken) {
      try {
        const response = await fetch('https://api.zeptomail.in/v1.1/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Zoho-enczapikey ${zeptoToken}`,
          },
          body: JSON.stringify({
            from: {
              address:
                this.configService.get<string>('SMTP_FROM_EMAIL') ||
                this.configService.get<string>('SMTP_USER') ||
                'noreply@akamdigital.com',
              name: 'AKAM Digital Editorial Desk',
            },
            to: [
              {
                email_address: {
                  address: email,
                  name: authorName,
                },
              },
            ],
            subject,
            htmlbody: html,
          }),
        });

        if (response.ok) {
          this.logger.log(`✅ Story published email sent to ${email} via ZeptoMail`);
          return true;
        } else {
          const errBody = await response.text();
          this.logger.warn(`ZeptoMail HTTP failed (${response.status}): ${errBody}`);
        }
      } catch (e) {
        this.logger.warn(`ZeptoMail HTTP error: ${(e as Error).message}`);
      }
    }

    // 2. Fallback to SMTP
    try {
      const transporter = this.getTransporter();
      const fromAddress =
        this.configService.get<string>('SMTP_FROM') ||
        `"AKAM Digital" <${this.configService.get('SMTP_USER')}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: `"${authorName}" <${email}>`,
        subject,
        html,
      });
      this.logger.log(`✅ Story published email sent to ${email} via SMTP. MsgId: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`❌ Failed to send published email to ${email}: ${(error as Error).message}`);
      return false;
    }
  }

  async findAll(
    status?: string,
    pageVal?: number,
    limitVal?: number,
    search?: string,
    category?: string,
    authorId?: string,
    featured?: string,
  ) {
    const page = pageVal && pageVal > 0 ? pageVal : 1;
    const limit = limitVal && limitVal > 0 ? limitVal : 10;
    const offset = (page - 1) * limit;

    let whereSql = '';
    const params: any[] = [];

    if (status === 'CATALOG') {
      whereSql = `WHERE s.status IN ('APPROVED'::"StoryStatus", 'UNPUBLISHED'::"StoryStatus")`;
    } else if (status === 'ALL') {
      whereSql = `WHERE 1=1`;
    } else if (status === 'EMAGAZINE_ALL') {
      whereSql = `WHERE s.status IN ('APPROVED_EMAGAZINE'::"StoryStatus", 'PUBLISHED_EMAGAZINE'::"StoryStatus")`;
    } else {
      const storyStatus = status ?? 'APPROVED';
      whereSql = `WHERE s.status = $1::"StoryStatus"`;
      params.push(storyStatus);
    }

    if (featured === 'true' || featured === '1') {
      whereSql += ` AND s."isFeatured" = true`;
    }

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
         s.id, s.title, s.slug, s.description, s.content, s.category, s."coverImageUrl",
         s."submissionType", s."mediaUrl",
         s.status, s."isFeatured", s."createdAt",
         s."authorId",
         u.name AS "authorName",
         u."avatarUrl" AS "authorAvatarUrl"
       FROM story s
       JOIN "user" u ON u.id = s."authorId"
       ${whereSql}
       ORDER BY s."isFeatured" DESC NULLS LAST, s."createdAt" DESC
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams,
    );

    // For public catalog queries (not internal editorial), truncate content to preview only
    const isEditorialQuery = status === 'CATALOG' || status === 'ALL' || status === 'EMAGAZINE_ALL';
    if (!isEditorialQuery) {
      for (const item of data) {
        if (item.content) {
          item.content = this.generateContentPreview(item.content);
        }
      }
    }

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

  /**
   * Internal helper to fetch full unmodified story record from database.
   */
  async findRawStory(idOrSlug: string): Promise<StoryRow> {
    const story = await this.prisma.queryOne<StoryRow>(
      `SELECT
         s.id, s.title, s.slug, s.description, s.content, s.category, s."coverImageUrl",
         s."submissionType", s."mediaUrl",
         s.status, s."rejectionNote", s."createdAt", s."updatedAt",
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

  /**
   * Truncates content for non-subscribers to provide an engaging preview
   * while completely preventing full story data leakage over the network.
   */
  private generateContentPreview(content: string, maxChars: number = 650): string {
    if (!content) return '';
    const trimmed = content.trim();
    if (trimmed.length <= maxChars) {
      const halfLen = Math.max(80, Math.floor(trimmed.length * 0.5));
      const spaceIdx = trimmed.lastIndexOf(' ', halfLen);
      return (spaceIdx > 0 ? trimmed.slice(0, spaceIdx) : trimmed.slice(0, halfLen)) + '...';
    }

    // Try finding a paragraph boundary within maxChars
    const slice = trimmed.slice(0, maxChars);
    const paragraphBreak = slice.lastIndexOf('\n\n');
    if (paragraphBreak > 200) {
      return slice.slice(0, paragraphBreak).trim();
    }

    // Try finding a sentence boundary
    const sentenceMatches = [...slice.matchAll(/[.!?]\s+/g)];
    if (sentenceMatches.length > 0) {
      const last = sentenceMatches[sentenceMatches.length - 1];
      if (last.index && last.index > 200) {
        return slice.slice(0, last.index + 1).trim();
      }
    }

    // Fallback: nearest space
    const spaceIdx = slice.lastIndexOf(' ');
    if (spaceIdx > 150) {
      return slice.slice(0, spaceIdx).trim() + '...';
    }

    return slice.trim() + '...';
  }

  async findOne(
    idOrSlug: string,
    userId?: string,
    userRole?: string,
  ): Promise<StoryRow & { hasFullAccess?: boolean; totalLength?: number; previewLength?: number }> {
    const story = await this.findRawStory(idOrSlug);

    // Determine access permissions
    const isAuthor = Boolean(userId && story.authorId === userId);
    const roleUpper = (userRole || '').toUpperCase();
    const isEditorOrAdmin = ['ADMIN', 'EDITOR', 'EDITORIAL', 'CHIEF_EDITOR', 'STAFF_EDITOR'].includes(roleUpper);
    let isSubscribed = false;

    if (userId) {
      try {
        if (this.subscriptionService) {
          const sub = await this.subscriptionService.getByUserId(userId);
          isSubscribed = Boolean(sub && sub.status === 'ACTIVE' && new Date(sub.endDate) > new Date());
        } else {
          const subRow = await this.prisma.queryOne<{ active: boolean }>(
            `SELECT (status = 'ACTIVE' AND "endDate" > now()) AS active
             FROM subscription WHERE "userId" = $1`,
            [userId],
          );
          isSubscribed = subRow?.active === true;
        }
      } catch (err) {
        this.logger.error(`Error checking subscription status for user ${userId}:`, err);
      }
    }

    const hasFullAccess = isAuthor || isEditorOrAdmin || isSubscribed;
    const totalLength = story.content ? story.content.length : 0;
    let previewLength = totalLength;

    if (!hasFullAccess && story.content) {
      story.content = this.generateContentPreview(story.content);
      previewLength = story.content.length;
    }

    return {
      ...story,
      hasFullAccess,
      totalLength,
      previewLength,
    };
  }

  async getAuthorStories(authorId: string): Promise<StoryRow[]> {
    return this.prisma.query<StoryRow>(
      `SELECT id, title, slug, description, category, "coverImageUrl", "submissionType", "mediaUrl", status, "createdAt", "updatedAt"
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

    const categoryVal = dto.category?.trim() || 'General';
    const descriptionVal = dto.description?.trim() || null;
    const submissionTypeVal = dto.submissionType || 'STORY';
    const mediaUrlVal = dto.mediaUrl?.trim() || null;
    const contentVal = dto.content ?? '';

    const story = await this.prisma.queryOne<StoryRow>(
      `INSERT INTO story (id, title, slug, description, content, category, status, "submissionType", "mediaUrl", "authorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::"StoryStatus", $7::"SubmissionType", $8, $9, now(), now())
       RETURNING id, title, slug, description, category, "submissionType", "mediaUrl", status, "createdAt"`,
      [dto.title, slug, descriptionVal, contentVal, categoryVal, initialStatus, submissionTypeVal, mediaUrlVal, targetAuthorId],
    );

    return story!;
  }

  async update(id: string, authorId: string, dto: UpdateStoryDto): Promise<StoryRow> {
    const story = await this.findRawStory(id);
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
    if (dto.description !== undefined) {
      params.push(dto.description);
      updates.push(`description = $${params.length}`);
    }
    if (dto.content !== undefined) {
      params.push(dto.content);
      updates.push(`content = $${params.length}`);
    }
    if (dto.category !== undefined) {
      params.push(dto.category);
      updates.push(`category = $${params.length}`);
    }
    if (dto.submissionType !== undefined) {
      params.push(dto.submissionType);
      updates.push(`"submissionType" = $${params.length}::"SubmissionType"`);
    }
    if (dto.mediaUrl !== undefined) {
      params.push(dto.mediaUrl);
      updates.push(`"mediaUrl" = $${params.length}`);
    }

    params.push(id);
    const idParamIndex = params.length;

    return (await this.prisma.queryOne<StoryRow>(
      `UPDATE story SET ${updates.join(', ')}
       WHERE id = $${idParamIndex}
       RETURNING id, title, slug, description, category, "submissionType", "mediaUrl", status, "updatedAt"`,
      params,
    ))!;
  }

  async submitForReview(id: string, authorId: string): Promise<{ id: string; status: string }> {
    const story = await this.findRawStory(id);
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
    const story = await this.findRawStory(id);
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
      whereSql += ` AND (s.title ILIKE $1 OR u.name ILIKE $1 OR u.email ILIKE $1 OR s.category ILIKE $1 OR s.description ILIKE $1)`;
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
         s.id, s.title, s.slug, s.description, s.content, s.category, s."coverImageUrl",
         s."submissionType", s."mediaUrl",
         s.status, s."rejectionNote", s."createdAt", s."updatedAt",
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
    const story = await this.findRawStory(id);
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
      try {
        await this.sendStoryPublishedEmail(story, 'WEB');
      } catch (err) {
        this.logger.error('Failed to send published email to author', err);
      }
      return { id, status: 'APPROVED' };
    } else if (dto.decision === 'UNPUBLISHED') {
      await this.prisma.execute(
        `UPDATE story SET status = 'UNPUBLISHED'::"StoryStatus", "rejectionNote" = null, "updatedAt" = now()
         WHERE id = $1`,
        [id],
      );
      return { id, status: 'UNPUBLISHED' };
    } else if (dto.decision === 'APPROVED_EMAGAZINE') {
      await this.prisma.execute(
        `UPDATE story SET status = 'APPROVED_EMAGAZINE'::"StoryStatus", "rejectionNote" = null, "updatedAt" = now()
         WHERE id = $1`,
        [id],
      );
      await this.notificationsService.notifyAuthorOfEmagazineApproval(
        story.authorId,
        story.title,
        id,
      );
      return { id, status: 'APPROVED_EMAGAZINE' };
    } else if (dto.decision === 'PUBLISHED_EMAGAZINE') {
      await this.prisma.execute(
        `UPDATE story SET status = 'PUBLISHED_EMAGAZINE'::"StoryStatus", "rejectionNote" = null, "updatedAt" = now()
         WHERE id = $1`,
        [id],
      );
      await this.notificationsService.notifyAuthorOfEmagazinePublished(
        story.authorId,
        story.title,
        id,
      );
      try {
        await this.sendStoryPublishedEmail(story, 'EMAGAZINE');
      } catch (err) {
        this.logger.error('Failed to send emagazine published email to author', err);
      }
      return { id, status: 'PUBLISHED_EMAGAZINE' };
    } else if (dto.decision === 'PENDING') {
      await this.prisma.execute(
        `UPDATE story SET status = 'PENDING'::"StoryStatus", "rejectionNote" = null, "updatedAt" = now()
         WHERE id = $1`,
        [id],
      );
      return { id, status: 'PENDING' };
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
    const story = await this.findRawStory(id);
    if (story.authorId !== userId && !['EDITOR', 'ADMIN'].includes(userRole)) {
      throw new ForbiddenException('Not authorized to delete this story');
    }

    if (story.authorId !== userId && ['EDITOR', 'ADMIN'].includes(userRole)) {
      try {
        await this.notificationsService.notifyAuthorOfContentRemoval(story.authorId, story.title, false, id);
      } catch (err) {
        console.error('Error notifying author of story removal', err);
      }
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

  async toggleFeatured(id: string) {
    const story = await this.prisma.queryOne<{ id: string; isFeatured: boolean | null }>(
      `SELECT id, "isFeatured" FROM story WHERE id = $1`,
      [id],
    );
    if (!story) throw new NotFoundException('Story not found');
    const newStatus = !story.isFeatured;
    return this.prisma.queryOne(
      `UPDATE story SET "isFeatured" = $1, "updatedAt" = now() WHERE id = $2 RETURNING *`,
      [newStatus, id],
    );
  }
}
