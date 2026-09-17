import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/decorators/current-user.decorator.js';
import { LibraryService } from './library.service.js';
import { UpdateProgressDto } from './dto/update-progress.dto.js';

@ApiTags('Library')
@Controller()
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Post('stories/:id/progress')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update user reading progress for a story' })
  async updateProgress(
    @Param('id') storyId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.libraryService.updateProgress(user.id, storyId, dto);
  }

  @Get('users/me/library')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user library with server-side pagination and tab counts' })
  @ApiQuery({ name: 'tab', required: false, enum: ['inProgress', 'bookmarked', 'liked', 'completed'] })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getUserLibrary(
    @CurrentUser() user: AuthUser,
    @Query('tab') tab?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (page || tab) {
      const pageNum = Math.max(1, parseInt(page || '1', 10));
      const limitNum = Math.max(1, parseInt(limit || '9', 10));
      return this.libraryService.getUserLibraryPaginated(user.id, tab, pageNum, limitNum);
    }
    return this.libraryService.getUserLibrary(user.id);
  }
}
