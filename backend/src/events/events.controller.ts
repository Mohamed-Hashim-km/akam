import { Controller, Get, Post, Param, Query, Body, Req, Res, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import type { Response as ExpressResponse } from 'express';
import { EventsService } from './events.service.js';
import { EventType } from './events.types.js';
import { RegisterEventDto } from './dto/register-event.dto.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';

@ApiTags('Events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'List all published events, workshops, reading sessions, and past archives (optionally paginated)' })
  @ApiQuery({ name: 'type', enum: EventType, required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'upcoming', required: false, type: Boolean })
  findAllPublished(
    @Query('type') type?: EventType,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('upcoming') upcoming?: string,
  ) {
    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.max(1, Math.min(50, parseInt(limit || '6', 10)));
      const isUpcoming = upcoming !== 'false';
      return this.eventsService.findPublishedPaginated(type, pageNum, limitNum, isUpcoming);
    }
    return this.eventsService.findAllPublished(type);
  }

  @Get('past-archives')
  @ApiOperation({ summary: 'Get paginated past event archives' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findPastArchives(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = Math.max(1, parseInt(page || '1', 10));
    const limitNum = Math.max(1, Math.min(50, parseInt(limit || '6', 10)));
    return this.eventsService.findPastArchivesPaginated(pageNum, limitNum);
  }

  /**
   * POST /api/events/payu/callback — browser callback from PayU gateway for event tickets
   */
  @Post('payu/callback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'PayU callback endpoint for paid event registrations' })
  async payUEventCallback(@Req() req: any, @Res() res: ExpressResponse) {
    const body = req.body || {};
    const frontendUrl = this.eventsService.getFrontendUrl();

    try {
      const verification = this.eventsService.verifyPayUResponse(body);

      if (verification.isValid && verification.status === 'success') {
        // Automatically confirm event registration and dispatch email!
        await this.eventsService.confirmPaidEventRegistration(verification.txnid, body);

        return res.redirect(
          302,
          `${frontendUrl}/events/thank-you?status=success&txnid=${encodeURIComponent(verification.txnid)}`,
        );
      } else {
        const errorMsg = verification.errorMessage || 'Payment was not successful or cancelled';
        return res.redirect(
          302,
          `${frontendUrl}/events/thank-you?status=failed&reason=${encodeURIComponent(errorMsg)}&txnid=${encodeURIComponent(verification.txnid || '')}`,
        );
      }
    } catch (err: any) {
      return res.redirect(
        302,
        `${frontendUrl}/events/thank-you?status=failed&reason=${encodeURIComponent(err.message || 'Payment error')}`,
      );
    }
  }

  @Get('registration/:identifier')
  @ApiOperation({ summary: 'Get confirmed event registration by txnId or registration ID' })
  getRegistration(@Param('identifier') identifier: string) {
    return this.eventsService.getRegistrationByTxnOrId(identifier);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get published event by ID' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post(':id/bolt-payload')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Generate PayU Bolt payload for paid event registration' })
  getBoltPayload(
    @Param('id') id: string,
    @Body() body: { name: string; email: string; phone?: string },
    @Req() req: any,
  ) {
    return this.eventsService.createBoltPayloadForEvent(id, body, req.user?.id);
  }

  @Post(':id/register')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Register for an event or workshop' })
  register(@Param('id') id: string, @Body() dto: RegisterEventDto, @Req() req: any) {
    return this.eventsService.registerForEvent(id, dto, req.user?.id);
  }
}
