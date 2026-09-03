import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/decorators/current-user.decorator.js';
import { ModerationService } from './moderation.service.js';
import { CreateReportDto } from './dto/create-report.dto.js';
import { UpdateReportStatusDto } from './dto/update-report-status.dto.js';

@ApiTags('Moderation')
@Controller()
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('stories/:id/report')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a content report for a story' })
  async createReport(
    @Param('id') storyId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.createReport(user.id, storyId, dto);
  }

  @Post('stories/comments/:commentId/report')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a content report for a comment' })
  async createCommentReport(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReportDto,
  ) {
    return this.moderationService.createCommentReport(user.id, commentId, dto);
  }

  @Get('editorial/reports')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor] List reported content' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Status filter (ALL, PENDING, RESOLVED, DISMISSED)' })
  @ApiQuery({ name: 'type', required: false, description: 'Type filter (ALL, STORY, COMMENT)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  async getReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.moderationService.getReports({ page, limit, status, type, search });
  }

  @Patch('editorial/reports/:reportId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor] Resolve or dismiss a report' })
  async updateReportStatus(
    @Param('reportId') reportId: string,
    @Body() dto: UpdateReportStatusDto,
  ) {
    return this.moderationService.updateReportStatus(reportId, dto);
  }

  @Post('contact-inquiries')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a contact form inquiry' })
  async createContactInquiry(
    @Body() dto: { name: string; email: string; phone?: string; subject: string; message: string },
  ) {
    return this.moderationService.createContactInquiry(dto);
  }

  @Get('editorial/contact-inquiries')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor] List contact form inquiries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, description: 'Status filter' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  async getContactInquiries(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.moderationService.getContactInquiries({ page, limit, status, search });
  }

  @Patch('editorial/contact-inquiries/:id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor] Update status of contact inquiry' })
  async updateContactInquiryStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.moderationService.updateContactInquiryStatus(id, status);
  }
}
