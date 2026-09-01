import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { CreateCommunityDto } from './dto/create-community.dto.js';
import { UpdateCommunityDto } from './dto/update-community.dto.js';

export interface CommunityRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  iconUrl: string | null;
  color: string | null;
  isActive: boolean;
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<CommunityRow[]> {
    return this.prisma.query<CommunityRow>(
      `SELECT id, slug, name, description, "bannerUrl", "iconUrl", color,
              "isActive", "memberCount", "postCount", "createdAt", "updatedAt"
       FROM community
       WHERE "isActive" = true
       ORDER BY name ASC`,
    );
  }

  async findBySlug(slug: string, userId?: string): Promise<CommunityRow & { isMember: boolean }> {
    const community = await this.prisma.queryOne<CommunityRow>(
      `SELECT id, slug, name, description, "bannerUrl", "iconUrl", color,
              "isActive", "memberCount", "postCount", "createdAt", "updatedAt"
       FROM community WHERE slug = $1`,
      [slug],
    );

    if (!community) throw new NotFoundException(`Community '${slug}' not found`);

    let isMember = false;
    if (userId) {
      const membership = await this.prisma.queryOne<{ id: string }>(
        `SELECT id FROM community_membership WHERE "userId" = $1 AND "communityId" = $2`,
        [userId, community.id],
      );
      isMember = !!membership;
    }

    return { ...community, isMember };
  }

  async joinCommunity(userId: string, slug: string): Promise<{ joined: boolean; memberCount: number }> {
    const community = await this.prisma.queryOne<{ id: string; memberCount: number }>(
      `SELECT id, "memberCount" FROM community WHERE slug = $1 AND "isActive" = true`,
      [slug],
    );
    if (!community) throw new NotFoundException(`Community '${slug}' not found`);

    const existing = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community_membership WHERE "userId" = $1 AND "communityId" = $2`,
      [userId, community.id],
    );
    if (existing) {
      return { joined: true, memberCount: community.memberCount };
    }

    await this.prisma.execute(
      `INSERT INTO community_membership (id, "userId", "communityId", role, "joinedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'MEMBER', now())`,
      [userId, community.id],
    );
    await this.prisma.execute(
      `UPDATE community SET "memberCount" = "memberCount" + 1, "updatedAt" = now() WHERE id = $1`,
      [community.id],
    );

    return { joined: true, memberCount: community.memberCount + 1 };
  }

  async leaveCommunity(userId: string, slug: string): Promise<{ left: boolean; memberCount: number }> {
    const community = await this.prisma.queryOne<{ id: string; memberCount: number }>(
      `SELECT id, "memberCount" FROM community WHERE slug = $1`,
      [slug],
    );
    if (!community) throw new NotFoundException(`Community '${slug}' not found`);

    const deleted = await this.prisma.execute(
      `DELETE FROM community_membership WHERE "userId" = $1 AND "communityId" = $2`,
      [userId, community.id],
    );

    if (deleted > 0) {
      await this.prisma.execute(
        `UPDATE community
         SET "memberCount" = GREATEST("memberCount" - 1, 0), "updatedAt" = now()
         WHERE id = $1`,
        [community.id],
      );
    }

    return { left: true, memberCount: Math.max(0, community.memberCount - 1) };
  }

  async create(dto: CreateCommunityDto): Promise<CommunityRow> {
    const existing = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community WHERE slug = $1`,
      [dto.slug],
    );
    if (existing) throw new ConflictException(`Community slug '${dto.slug}' already exists`);

    const community = await this.prisma.queryOne<CommunityRow>(
      `INSERT INTO community (id, slug, name, description, "bannerUrl", "iconUrl", color, "isActive", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, now(), now())
       RETURNING *`,
      [
        dto.slug,
        dto.name,
        dto.description ?? null,
        dto.bannerUrl ?? null,
        dto.iconUrl ?? null,
        dto.color ?? null,
        dto.isActive ?? true,
      ],
    );
    return community!;
  }

  async update(slug: string, dto: UpdateCommunityDto): Promise<CommunityRow> {
    const community = await this.prisma.queryOne<{ id: string }>(
      `SELECT id FROM community WHERE slug = $1`,
      [slug],
    );
    if (!community) throw new NotFoundException(`Community '${slug}' not found`);

    const updates: string[] = ['"updatedAt" = now()'];
    const params: unknown[] = [];

    const fields: Array<[keyof UpdateCommunityDto, string]> = [
      ['name', 'name'],
      ['description', 'description'],
      ['bannerUrl', '"bannerUrl"'],
      ['iconUrl', '"iconUrl"'],
      ['color', 'color'],
      ['isActive', '"isActive"'],
    ];

    for (const [key, col] of fields) {
      if (dto[key] !== undefined) {
        params.push(dto[key]);
        updates.push(`${col} = $${params.length}`);
      }
    }

    params.push(community.id);

    return (await this.prisma.queryOne<CommunityRow>(
      `UPDATE community SET ${updates.join(', ')} WHERE id = $${params.length} RETURNING *`,
      params,
    ))!;
  }
}
