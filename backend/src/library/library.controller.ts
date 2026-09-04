import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Get current user library (in-progress, saved, liked, completed)' })
  async getUserLibrary(@CurrentUser() user: AuthUser) {
    return this.libraryService.getUserLibrary(user.id);
  }
}
