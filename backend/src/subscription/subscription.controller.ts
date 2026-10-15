import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { SubscriptionService } from './subscription.service.js';
import { PayUService } from './payu.service.js';
import { PrismaService } from '../common/prisma/prisma.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@Controller('subscription')
export class SubscriptionController {
  private readonly logger = new Logger(SubscriptionController.name);

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly payUService: PayUService,
    private readonly prisma: PrismaService,
  ) {}

  /** GET /api/subscription/payu/config — public PayU config (merchant key, env, url) */
  @Get('payu/config')
  getPayUConfig() {
    return this.payUService.getPublicConfig();
  }

  /** POST /api/subscription/payu/initiate — generate signed PayU hosted checkout payload */
  @Post('payu/initiate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async initiatePayU(
    @Request() req: any,
    @Body() body: { planType?: string; amount?: number; phone?: string },
  ) {
    const userId = req.user.id || req.user.sub;
    const user = await this.prisma.queryOne<{ id: string; email: string; name: string | null }>(
      `SELECT id, email, name FROM "user" WHERE id = $1`,
      [userId],
    );

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const payload = this.payUService.createPaymentPayload({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: body.phone,
      planType: body.planType || 'SIX_MONTH',
      amount: body.amount || 1,
    });

    return payload;
  }

  /** POST /api/subscription/payu/bolt-payload — returns payload and hash for PayU Bolt popup */
  @Post('payu/bolt-payload')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getBoltPayload(
    @Request() req: any,
    @Body() body: { planType?: string; amount?: number; phone?: string },
  ) {
    const userId = req.user.id || req.user.sub;
    const user = await this.prisma.queryOne<{ id: string; email: string; name: string | null }>(
      `SELECT id, email, name FROM "user" WHERE id = $1`,
      [userId],
    );

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const payload = this.payUService.createBoltPayload({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      phone: body.phone,
      planType: body.planType || 'SIX_MONTH',
      amount: body.amount || 1,
    });

    return payload;
  }


  /**
   * POST /api/subscription/payu/callback — browser callback from PayU hosted gateway
   * Note: This is an unauthenticated endpoint as PayU redirects the client browser here via POST
   */
  @Post('payu/callback')
  @HttpCode(HttpStatus.OK)
  async payUCallback(@Req() req: any, @Res() res: ExpressResponse) {
    const body = req.body || {};
    const frontendUrl = this.payUService.getFrontendUrl();

    try {
      const verification = this.payUService.verifyResponseHash(body);
      const isEventTicket =
        verification.planType === 'EVENT_TICKET' ||
        verification.txnid.startsWith('EVT_') ||
        String(body.productinfo || '').toLowerCase().includes('ticket');

      if (verification.isValid && verification.status === 'success') {
        if (isEventTicket) {
          this.logger.warn(
            `[PayU Subscription Callback] Received event ticket payment txnid=${verification.txnid}. Bypassing subscription activation.`,
          );
          return res.redirect(
            302,
            `${frontendUrl}/events/thank-you?status=success&txnid=${encodeURIComponent(verification.txnid)}`,
          );
        }

        if (verification.userId && !verification.userId.startsWith('guest_')) {
          await this.subscriptionService.activate(verification.userId, verification.txnid);
        }
        return res.redirect(
          302,
          `${frontendUrl}/plans/payment-status?status=success&txnid=${encodeURIComponent(verification.txnid)}&amount=${encodeURIComponent(verification.amount)}`,
        );
      } else {
        const errorMsg = verification.errorMessage || 'Payment was not successful or hash mismatch';
        if (isEventTicket) {
          return res.redirect(
            302,
            `${frontendUrl}/events/thank-you?status=failed&reason=${encodeURIComponent(errorMsg)}&txnid=${encodeURIComponent(verification.txnid || '')}`,
          );
        }
        return res.redirect(
          302,
          `${frontendUrl}/plans/payment-status?status=failed&reason=${encodeURIComponent(errorMsg)}&txnid=${encodeURIComponent(verification.txnid || '')}`,
        );
      }
    } catch (err: any) {
      return res.redirect(
        302,
        `${frontendUrl}/plans/payment-status?status=failed&reason=${encodeURIComponent(err.message || 'Payment processing error')}`,
      );
    }
  }

  /**
   * POST /api/subscription/payu/process-seamless
   * Seamless in-app PayU payment processing (UPI / Card / Net Banking)
   * Computes SHA-512 hash using Merchant Key (0OlbkD) and Salt, activates subscription in DB
   * and returns full confirmation without leaving the website.
   */
  @Post('payu/process-seamless')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async processSeamless(
    @Request() req: any,
    @Body() body: { paymentMethod?: string; upiId?: string; planType?: string; amount?: number },
  ) {
    const userId = req.user.id || req.user.sub;
    const user = await this.prisma.queryOne<{ id: string; email: string; name: string | null }>(
      `SELECT id, email, name FROM "user" WHERE id = $1`,
      [userId],
    );

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const amountNum = typeof body.amount === 'number' && body.amount > 0 ? body.amount : 1;
    const planType = body.planType || 'SIX_MONTH';

    // Generate genuine PayU payload & SHA-512 Hash with Key & Salt
    const payload = this.payUService.createPaymentPayload({
      userId: user.id,
      email: user.email,
      name: user.name || undefined,
      planType,
      amount: amountNum,
    });

    // Activate subscription in PostgreSQL DB
    const sub = await this.subscriptionService.activate(userId, payload.params.txnid);

    return {
      success: true,
      txnid: payload.params.txnid,
      hash: payload.params.hash,
      merchantKey: payload.params.key,
      amount: payload.params.amount,
      planType,
      endDate: sub?.endDate,
      status: 'SUCCESS',
    };
  }

  /**
   * POST /api/subscription/payu/verify-simulation
   * For test environments to verify and activate testing flow
   */
  @Post('payu/verify-simulation')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifySimulation(
    @Request() req: any,
    @Body() body: { txnid?: string; planType?: string },
  ) {
    const userId = req.user.id || req.user.sub;
    const txnid = body.txnid || `SIM-PAYU-${Date.now()}`;
    const sub = await this.subscriptionService.activate(userId, txnid);
    return {
      success: true,
      isActive: true,
      endDate: sub?.endDate,
      planType: body.planType || 'SIX_MONTH',
      txnid,
    };
  }


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

  /** POST /api/subscription/activate — called after successful payment */
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

