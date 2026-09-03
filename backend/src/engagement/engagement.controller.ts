import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/decorators/current-user.decorator.js';
import { EngagementService } from './engagement.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';

@ApiTags('Engagement')
@Controller('stories')
export class EngagementController {
  constructor(private readonly engagementService: EngagementService) {}

  @Get(':id/engagement')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get engagement metrics (likes, comments, isLiked, isBookmarked)' })
  async getEngagement(
    @Param('id') storyId: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.engagementService.getEngagement(storyId, user?.id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle like status on a story' })
  async toggleLike(@Param('id') storyId: string, @CurrentUser() user: AuthUser) {
    return this.engagementService.toggleLike(user.id, storyId);
  }

  @Post(':id/bookmark')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Toggle bookmark status on a story' })
  async toggleBookmark(
    @Param('id') storyId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engagementService.toggleBookmark(user.id, storyId);
  }

  @Get('comments/recent')
  @ApiOperation({ summary: 'Get latest published comments across stories for Reader Reviews' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentComments(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.engagementService.getRecentComments(limitNum);
  }

  @Get('comments/editorial')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Get paginated reader reviews for curation' })
  async getCommentsEditorial(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.engagementService.getCommentsEditorial(pageNum, limitNum, search, featured);
  }

  @Patch('comments/:commentId/toggle-featured')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor/Admin] Toggle reader review featured on homepage status' })
  async toggleFeaturedComment(@Param('commentId') commentId: string) {
    return this.engagementService.toggleFeaturedComment(commentId);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a story' })
  async getComments(@Param('id') storyId: string) {
    return this.engagementService.getComments(storyId);
  }

  @Post(':id/comments')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Post a comment on a story' })
  async createComment(
    @Param('id') storyId: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.engagementService.createComment(user.id, storyId, dto.content);
  }

  @Delete('comments/:commentId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a comment (author or editor)' })
  async deleteComment(
    @Param('commentId') commentId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.engagementService.deleteComment(commentId, user.id, user.role);
  }
}
