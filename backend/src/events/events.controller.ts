import { Controller, Get, Post, Param, Query, Body, Req, UseGuards, Header } from '@nestjs/common';
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
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120')
  @ApiOperation({ summary: 'List all published events, workshops, reading sessions, and past archives' })
  @ApiQuery({ name: 'type', enum: EventType, required: false })
  findAllPublished(@Query('type') type?: EventType) {
    return this.eventsService.findAllPublished(type);
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120')
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
