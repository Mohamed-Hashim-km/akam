import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { SubscriptionService } from './subscription.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  /** GET /api/subscription/me — current user's subscription status */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(@Request() req: any) {
    const userId = req.user.id || req.user.sub;
    const userRole = (req.user?.role || '').toUpperCase();
    if (['ADMIN', 'EDITOR', 'EDITORIAL', 'CHIEF_EDITOR', 'STAFF_EDITOR'].includes(userRole)) {
      return {
        isActive: true,
        endDate: null,
        planType: 'EDITORIAL_ALL_ACCESS',
        isStudent: false,
      };
    }
    const sub = await this.subscriptionService.getByUserId(userId);
    if (!sub) {
      return { isActive: false, endDate: null, planType: null, isStudent: false };
    }
    const isActive = sub.status === 'ACTIVE' && new Date(sub.endDate) > new Date();
    return {
      isActive,
      endDate: isActive ? sub.endDate : null,
      planType: isActive ? sub.planType : null,
      isStudent: Boolean(isActive && sub.isStudent),
    };
  }

  /** POST /api/subscription/activate — called after successful PayU payment */
  @Post('activate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async activate(@Request() req: any, @Body() body: { txnId?: string }) {
    const userId = req.user.id || req.user.sub;
    const sub = await this.subscriptionService.activate(userId, body.txnId || 'MANUAL');
    return {
      isActive: true,
      endDate: sub?.endDate,
      planType: 'SIX_MONTH',
      isStudent: false,
    };
  }

  /**
   * POST /api/subscription/track-read
   * Body: { storyId, readSecs, hitPaywall }
   * Logged-in users: tracks reading time per story in DB.
   * Returns { paywallHit: boolean } so frontend knows if to show paywall.
   */
  @Post('track-read')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async trackRead(
    @Request() req: any,
    @Body() body: { storyId: string; readSecs: number; hitPaywall?: boolean },
  ) {
    const userId = req.user.id || req.user.sub;
    const result = await this.subscriptionService.upsertReadSecs(
      userId,
      body.storyId,
      body.readSecs || 0,
      body.hitPaywall === true,
    );
    return result;
  }

  /**
   * GET /api/subscription/read-status/:storyId
   * Returns { readSecs, paywallHit } for the current logged-in user + story.
   */
  @Get('read-status/:storyId')
  @UseGuards(JwtAuthGuard)
  async getReadStatus(@Request() req: any, @Param('storyId') storyId: string) {
    const userId = req.user.id || req.user.sub;
    const readSecs = await this.subscriptionService.getReadSecs(userId, storyId);
    const paywallHit = await this.subscriptionService.hasHitPaywall(userId, storyId);
    return { readSecs, paywallHit };
  }

  // ── Editorial Routes (Admin & Editor) ─────────────────────────────────────

  /** GET /api/subscription/editorial/stats — KPI metrics */
  @Get('editorial/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  async getEditorialStats() {
    return this.subscriptionService.getEditorialStats();
  }

  /** GET /api/subscription/editorial/list — paginated subscribers with filters */
  @Get('editorial/list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  async getEditorialList(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    return this.subscriptionService.findAllEditorial({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      status,
      type,
    });
  }

  /** POST /api/subscription/editorial/grant — grant/extend a subscription */
  @Post('editorial/grant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async grantSubscription(
    @Body()
    body: {
      email: string;
      durationMonths?: number;
      isStudent?: boolean;
      note?: string;
    },
  ) {
    if (!body.email || !body.email.trim()) {
      throw new BadRequestException('User email is required to grant a subscription');
    }
    try {
      const sub = await this.subscriptionService.grantSubscription(
        body.email.trim(),
        body.durationMonths || 6,
        body.isStudent === true,
        body.note,
      );
      return { success: true, subscription: sub };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to grant subscription');
    }
  }

  /** POST /api/subscription/editorial/:id/cancel — cancel a subscription */
  @Post('editorial/:id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async cancelSubscription(@Param('id') id: string) {
    await this.subscriptionService.cancelSubscription(id);
    return { success: true, message: 'Subscription cancelled successfully' };
  }
}

