import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { SubscriptionService } from '../subscription/subscription.service.js';
import { MailService } from '../mail/mail.service.js';
import { RevalidateService } from '../common/revalidate/revalidate.service.js';
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
  authorIsShadowBanned?: boolean;
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
    private mailService: MailService,
    private revalidateService: RevalidateService,
    @Optional() private subscriptionService?: SubscriptionService,
  ) { }

  private async sendStoryPublishedEmail(story: StoryRow, type: 'EMAGAZINE' | 'WEB'): Promise<boolean> {
    const email = story.authorEmail;
    if (!email) {
      this.logger.warn(`No email found for author of story ${story.id}`);
      return false;
    }

    const authorName = story.authorName || 'Author';
    const isEmagazine = type === 'EMAGAZINE';
    const subject = isEmagazine
      ? `🎉 Your submission "${story.title}" is published in the AKAM Magazine!`
      : `🎉 Your story "${story.title}" has been published on AKAM Digital!`;

    const messageHeading = isEmagazine
      ? 'Published in AKAM Magazine Edition!'
      : 'Published on AKAM Digital Works Catalog!';

    const messageBody = isEmagazine
      ? `We are delighted to inform you that your curated submission <strong>"${story.title}"</strong> has been officially published in the AKAM Digital Magazine edition.`
      : `We are pleased to inform you that your story <strong>"${story.title}"</strong> has been approved and published to the live public works catalog on AKAM Digital.`;

    const logoUrl = 'https://akamdigital.in/images/akamdigital.png';
    const frontendUrl = 'https://akamdigital.in';
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${messageHeading}</title>
  <style>
    body { font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; margin: 0; padding: 40px 16px; -webkit-font-smoothing: antialiased; color: #040706; }
    .container { max-width: 580px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
    .brand-header { background-color: #FFFFFF; padding: 24px 32px; text-align: center; border-bottom: 1px solid #F1F5F9; }
    .gradient-ribbon { height: 4px; background: linear-gradient(90deg, #21B573 0%, #E4F953 50%, #21B573 100%); }
    .hero-section { padding: 36px 32px 18px 32px; text-align: center; }
    .badge { display: inline-block; background-color: #ECFDF5; border: 1px solid #A7F3D0; color: #065F46; font-size: 11px; font-weight: 700; letter-spacing: 1px; padding: 4px 14px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 12px; }
    .hero-h1 { color: #040706; font-size: 22px; margin: 0 0 10px 0; font-weight: 800; letter-spacing: -0.5px; }
    .content { padding: 0 32px 32px 32px; color: #475569; line-height: 1.6; }
    .content p { margin: 0 0 16px; font-size: 14px; }
    .highlight-card { background: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #21B573; border-radius: 14px; padding: 18px 20px; margin: 20px 0; }
    .highlight-title { font-size: 16px; font-weight: 700; color: #040706; margin-bottom: 6px; }
    .highlight-meta { font-size: 12px; color: #059669; font-weight: 600; }
    .btn { display: inline-block; background: linear-gradient(135deg, #21B573 0%, #0FA975 100%); color: #ffffff !important; font-size: 13px; font-weight: 800; text-decoration: none; padding: 14px 36px; border-radius: 9999px; letter-spacing: 0.5px; text-transform: uppercase; box-shadow: 0 10px 25px rgba(33, 181, 115, 0.25); }
    .footer { padding: 26px 32px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #E2E8F0; background-color: #F8FAFC; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Navbar Logo Header -->
    <div class="brand-header">
      <a href="${frontendUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
        <img src="${logoUrl}" alt="AKAM Digital" style="height: 46px; width: auto; max-width: 220px; display: block; border: 0;" />
      </a>
    </div>
    
    <!-- Gradient Ribbon -->
    <div class="gradient-ribbon"></div>

    <div class="hero-section">
      <div style="display: inline-block; width: 60px; height: 60px; line-height: 60px; border-radius: 50%; background-color: #ECFDF5; border: 2px solid #21B573; font-size: 28px; text-align: center; margin-bottom: 14px;">
        🎉
      </div>
      <div>
        <span class="badge">${isEmagazine ? 'AKAM Magazine Edition' : 'AKAM Live Works Catalog'}</span>
      </div>
      <h1 class="hero-h1">${messageHeading}</h1>
    </div>

    <div class="content">
      <p>Dear <strong style="color: #040706;">${authorName}</strong>,</p>
      <p style="color: #475569;">${messageBody}</p>
      
      <div class="highlight-card">
        <div class="highlight-title">${story.title}</div>
      </div>

      <p>Thank you for contributing to AKAM Digital and sharing your creative voice with our reader community across India and worldwide.</p>
      
      <div style="text-align: center; margin-top: 28px; margin-bottom: 8px;">
        <a href="${frontendUrl}/profile" class="btn">View on Your Profile →</a>
      </div>
    </div>

    <!-- Footer with Privacy Policy, Terms & Automation Notice -->
    <div class="footer">
      <p style="margin: 0 0 8px 0; font-size: 11px; color: #94A3B8;">
        <em>This is an automated email. Please do not reply directly to this message.</em>
      </p>
      <p style="margin: 0 0 10px 0; font-weight: 600; color: #334155;">
        AKAM Digital Editorial Desk • Kairali Books
      </p>
      <p style="margin: 0 0 10px 0;">
        <a href="${frontendUrl}/privacy-policy" style="color: #21B573; text-decoration: underline; margin: 0 8px;">Privacy Policy</a>
        •
        <a href="${frontendUrl}/terms" style="color: #21B573; text-decoration: underline; margin: 0 8px;">Terms of Service</a>
        •
        <a href="${frontendUrl}" style="color: #64748B; text-decoration: none; margin: 0 8px;">akamdigital.in</a>
      </p>
      <p style="margin: 0; font-size: 10px; color: #94A3B8;">
        © ${new Date().getFullYear()} AKAM Digital. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return this.mailService.sendMail({
      to: email,
      subject,
      html,
      fromName: 'AKAM Digital Editorial Desk',
    });
  }

  async findAll(
    status?: string,
    pageVal?: number,
    limitVal?: number,
    search?: string,
    category?: string,
    authorId?: string,
    featured?: string,
    submissionType?: string,
    sortBy?: string,
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

    const isEditorialQuery = status === 'CATALOG' || status === 'ALL' || status === 'EMAGAZINE_ALL';
    if (!isEditorialQuery) {
      whereSql += ` AND (u."isShadowBanned" IS NOT TRUE)`;
    }

    if (featured === 'true' || featured === '1') {
      whereSql += ` AND s."isFeatured" = true`;
    }

    if (submissionType && submissionType.trim() && submissionType.toUpperCase() !== 'ALL') {
      const typeUpper = submissionType.trim().toUpperCase();
      if (typeUpper === 'VIDEO') {
        whereSql += ` AND (s."submissionType" = 'VIDEO'::"SubmissionType" OR LOWER(s.category) = 'video')`;
      } else if (typeUpper === 'PAINTING') {
        whereSql += ` AND (s."submissionType" = 'PAINTING'::"SubmissionType" OR LOWER(s.category) = 'painting' OR LOWER(s.category) = 'art')`;
      } else if (typeUpper === 'STORY') {
        whereSql += ` AND (s."submissionType" = 'STORY'::"SubmissionType" OR s."submissionType" IS NULL) AND LOWER(COALESCE(s.category, '')) NOT IN ('video', 'painting', 'art')`;
      } else {
        params.push(typeUpper);
        whereSql += ` AND s."submissionType" = $${params.length}::"SubmissionType"`;
      }
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

    let orderBySql = `ORDER BY s."isFeatured" DESC NULLS LAST, s."createdAt" DESC`;
    if (sortBy === 'oldest') {
      orderBySql = `ORDER BY s."createdAt" ASC`;
    } else if (sortBy === 'title_asc') {
      orderBySql = `ORDER BY s.title ASC`;
    } else if (sortBy === 'featured') {
      orderBySql = `ORDER BY s."isFeatured" DESC NULLS LAST, s."createdAt" DESC`;
    }

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
       ${orderBySql}
       LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`,
      queryParams,
    );

    // For public catalog queries (not internal editorial), truncate content to preview only
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
         u.bio AS "authorBio",
         u."isShadowBanned" AS "authorIsShadowBanned"
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
  ): Promise<StoryRow & { hasFullAccess?: boolean; totalLength?: number; previewLength?: number; disputeInfo?: any }> {
    const story = await this.findRawStory(idOrSlug);

    // Determine access permissions
    const isAuthor = Boolean(userId && story.authorId === userId);
    const roleUpper = (userRole || '').toUpperCase();
    const isEditorOrAdmin = ['ADMIN', 'EDITOR', 'EDITORIAL', 'CHIEF_EDITOR', 'STAFF_EDITOR', 'MODERATOR'].includes(roleUpper);

    if (story.authorIsShadowBanned && !isAuthor && !isEditorOrAdmin) {
      throw new NotFoundException('Story not found');
    }

    if (story.status === 'DISPUTED' && !isAuthor && !isEditorOrAdmin) {
      throw new NotFoundException('This work is currently under editorial dispute review and temporarily unavailable.');
    }

    let disputeInfo: any = null;
    if (story.status === 'DISPUTED' && (isAuthor || isEditorOrAdmin)) {
      disputeInfo = await this.prisma.queryOne(
        `SELECT id, reason, details, "editorialNote", "disputedAt", "disputeExpiresAt", "authorResponse", "authorRespondedAt"
         FROM story_report
         WHERE "storyId" = $1 AND status = 'DISPUTED'
         ORDER BY "createdAt" DESC LIMIT 1`,
        [story.id],
      );
    }

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
      disputeInfo,
    };
  }

  async getAuthorStories(authorId: string): Promise<any[]> {
    return this.prisma.query<any>(
      `SELECT s.id, s.title, s.slug, s.description, s.category, s."coverImageUrl", s."submissionType", s."mediaUrl", s.status, s."rejectionNote", s."createdAt", s."updatedAt",
              r.id AS "activeDisputeId",
              r.reason AS "disputeReason",
              r.details AS "disputeDetails",
              r."editorialNote" AS "disputeEditorialNote",
              r."disputedAt",
              r."disputeExpiresAt",
              r."authorResponse" AS "disputeAuthorResponse",
              r."authorRespondedAt" AS "disputeAuthorRespondedAt"
       FROM story s
       LEFT JOIN story_report r ON r."storyId" = s.id AND r.status = 'DISPUTED'
       WHERE s."authorId" = $1
       ORDER BY s."updatedAt" DESC`,
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

    const isPaintingOrVideo = dto.submissionType === 'PAINTING' || dto.submissionType === 'VIDEO';
    const categoryVal = isPaintingOrVideo ? (dto.category?.trim() || null) : (dto.category?.trim() || 'General');
    const descriptionVal = dto.description?.trim() || null;
    const submissionTypeVal = dto.submissionType || 'STORY';
    const mediaUrlVal = dto.mediaUrl?.trim() || null;

    if (submissionTypeVal === 'VIDEO') {
      if (!mediaUrlVal) {
        throw new BadRequestException('A YouTube video URL is required for video submissions.');
      }
      const ytMatch = mediaUrlVal.match(
        /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/
      );
      if (!ytMatch) {
        throw new BadRequestException('Only YouTube video URLs (under 30 minutes) are accepted for video submissions.');
      }
    }

    const coverImageUrlVal = dto.coverImageUrl?.trim() || (isPaintingOrVideo ? (dto.mediaUrl?.trim() || null) : null);
    const contentVal = dto.content ?? '';

    const story = await this.prisma.queryOne<StoryRow>(
      `INSERT INTO story (id, title, slug, description, content, category, status, "submissionType", "mediaUrl", "coverImageUrl", "authorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6::"StoryStatus", $7::"SubmissionType", $8, $9, $10, now(), now())
       RETURNING id, title, slug, description, category, "submissionType", "mediaUrl", "coverImageUrl", status, "createdAt"`,
      [dto.title, slug, descriptionVal, contentVal, categoryVal, initialStatus, submissionTypeVal, mediaUrlVal, coverImageUrlVal, targetAuthorId],
    );

    return story!;
  }

  async update(id: string, authorId: string, dto: UpdateStoryDto): Promise<StoryRow> {
    const story = await this.findRawStory(id);
    if (story.authorId !== authorId) throw new ForbiddenException('Not your story');
    if (!['DRAFT', 'REJECTED', 'PENDING'].includes(story.status)) {
      throw new BadRequestException('Only DRAFT, REJECTED, or PENDING stories can be edited');
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
      const isPaintingOrVideo = (dto.submissionType || story.submissionType) === 'PAINTING' || (dto.submissionType || story.submissionType) === 'VIDEO';
      params.push(isPaintingOrVideo ? (dto.category?.trim() || null) : (dto.category?.trim() || 'General'));
      updates.push(`category = $${params.length}`);
    }
    if (dto.submissionType !== undefined) {
      params.push(dto.submissionType);
      updates.push(`"submissionType" = $${params.length}::"SubmissionType"`);
    }
    if (dto.mediaUrl !== undefined) {
      const isVideo = (dto.submissionType || story.submissionType) === 'VIDEO';
      if (isVideo && dto.mediaUrl) {
        const ytMatch = dto.mediaUrl.match(
          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/
        );
        if (!ytMatch) {
          throw new BadRequestException('Only YouTube video URLs (under 30 minutes) are accepted for video submissions.');
        }
      }
      params.push(dto.mediaUrl);
      updates.push(`"mediaUrl" = $${params.length}`);
    }
    if (dto.coverImageUrl !== undefined) {
      params.push(dto.coverImageUrl?.trim() || null);
      updates.push(`"coverImageUrl" = $${params.length}`);
    }

    params.push(id);
    const idParamIndex = params.length;

    return (await this.prisma.queryOne<StoryRow>(
      `UPDATE story SET ${updates.join(', ')}
       WHERE id = $${idParamIndex}
       RETURNING id, title, slug, description, category, "submissionType", "mediaUrl", "coverImageUrl", status, "updatedAt"`,
      params,
    ))!;
  }

  async submitForReview(id: string, authorId: string): Promise<{ id: string; status: string }> {
    const story = await this.findRawStory(id);
    if (story.authorId !== authorId) throw new ForbiddenException('Not your story');
    if (!['DRAFT', 'REJECTED', 'PENDING'].includes(story.status)) {
      throw new BadRequestException('Only DRAFT, REJECTED, or PENDING stories can be submitted');
    }
    if (!story.coverImageUrl) {
      if (story.mediaUrl) {
        await this.prisma.execute(
          `UPDATE story SET "coverImageUrl" = $1, "updatedAt" = now() WHERE id = $2`,
          [story.mediaUrl, id],
        );
        story.coverImageUrl = story.mediaUrl;
      } else {
        throw new BadRequestException('A cover image is required before submitting your story for editorial review');
      }
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
      this.revalidateService.revalidate('stories', '/');
      return { id, status: 'APPROVED' };
    } else if (dto.decision === 'UNPUBLISHED') {
      await this.prisma.execute(
        `UPDATE story SET status = 'UNPUBLISHED'::"StoryStatus", "rejectionNote" = $2, "updatedAt" = now()
         WHERE id = $1`,
        [id, dto.rejectionNote ?? null],
      );
      await this.notificationsService.notifyAuthorOfRejection(
        story.authorId,
        story.title,
        id,
        dto.rejectionNote || 'unpublish',
      );
      this.revalidateService.revalidate('stories', '/');
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
      this.revalidateService.revalidate('stories', '/');
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
      this.revalidateService.revalidate('stories', '/');
      return { id, status: 'PUBLISHED_EMAGAZINE' };
    } else if (dto.decision === 'PENDING') {
      await this.prisma.execute(
        `UPDATE story SET status = 'PENDING'::"StoryStatus", "rejectionNote" = null, "updatedAt" = now()
         WHERE id = $1`,
        [id],
      );
      this.revalidateService.revalidate('stories', '/');
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
      this.revalidateService.revalidate('stories', '/');
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
    this.revalidateService.revalidate('stories', '/');
    return { success: true };
  }

  async toggleFeatured(id: string) {
    const story = await this.prisma.queryOne<{ id: string; isFeatured: boolean | null }>(
      `SELECT id, "isFeatured" FROM story WHERE id = $1`,
      [id],
    );
    if (!story) throw new NotFoundException('Story not found');
    const newStatus = !story.isFeatured;
    const updated = await this.prisma.queryOne(
      `UPDATE story SET "isFeatured" = $1, "updatedAt" = now() WHERE id = $2 RETURNING *`,
      [newStatus, id],
    );
    this.revalidateService.revalidate('stories', '/');
    return updated;
  }
}
