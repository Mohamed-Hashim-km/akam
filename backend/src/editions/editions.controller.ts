import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EditionsService } from './editions.service.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/decorators/current-user.decorator.js';
import type { Request, Response } from 'express';

@ApiTags('Editions')
@Controller('editions')
export class EditionsController {
  constructor(private readonly editionsService: EditionsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get published editions with optional pagination' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: AuthUser,
  ) {
    if (page || limit) {
      const pageNum = parseInt(page || '1', 10) || 1;
      const limitNum = parseInt(limit || '3', 10) || 3;
      return this.editionsService.findAllPublishedPaginated(pageNum, limitNum, user?.id, user?.role);
    }
    return this.editionsService.findAllPublished(user?.id, user?.role);
  }

  @Get(':id/read-pdf')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Stream protected edition PDF for reader' })
  async streamPdf(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const hasAccess = await this.editionsService.checkUserHasSubscription(user?.id, user?.role);
    if (!hasAccess) {
      throw new ForbiddenException('An active subscription is required to read this edition.');
    }
    const realPdfUrl = await this.editionsService.getRealPdfUrl(id);
    if (!realPdfUrl) {
      throw new NotFoundException('Edition PDF not found.');
    }
    return this.editionsService.streamPdf(realPdfUrl, req, res);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get single edition by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.editionsService.findOne(id, user?.id, user?.role);
  }
}

