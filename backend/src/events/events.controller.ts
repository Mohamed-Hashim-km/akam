import { Controller, Get, Post, Param, Query, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
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

  @Get(':id')
  @ApiOperation({ summary: 'Get published event by ID' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post(':id/register')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Register for an event or workshop' })
  register(@Param('id') id: string, @Body() dto: RegisterEventDto, @Req() req: any) {
    return this.eventsService.registerForEvent(id, dto, req.user?.id);
  }
}
