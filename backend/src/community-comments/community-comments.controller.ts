import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CommunityCommentsService } from './community-comments.service.js';
import { CreateCommunityCommentDto } from './dto/create-community-comment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { IsString, IsOptional } from 'class-validator';

class ReportCommentDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;
}

@ApiTags('Community Comments')
@Controller()
export class CommunityCommentsController {
  constructor(private readonly service: CommunityCommentsService) {}

  @Get('posts/:postId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get full nested comment tree for a post (single DB round-trip via recursive CTE)' })
  getCommentTree(@Param('postId') postId: string, @Request() req: any) {
    return this.service.getCommentTree(postId, req.user?.id);
  }

  @Post('posts/:postId/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Post a root comment or reply (set parentId in body for replies)' })
  createComment(
    @Param('postId') postId: string,
    @Body() dto: CreateCommunityCommentDto,
    @Request() req: any,
  ) {
    return this.service.createComment(req.user.id, postId, dto);
  }

  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own comment | [EDITOR/ADMIN] soft-removes any comment' })
  deleteComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.service.deleteComment(commentId, req.user.id, req.user.role);
  }

  @Post('comments/:commentId/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a community comment' })
  reportComment(
    @Param('commentId') commentId: string,
    @Body() dto: ReportCommentDto,
    @Request() req: any,
  ) {
    return this.service.reportComment(req.user.id, commentId, dto.reason, dto.details);
  }
}
