import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Header,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PostsService } from './posts.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { IsString, IsOptional } from 'class-validator';

class ReportDto {
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  details?: string;
}

@ApiTags('Posts')
@Controller()
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('communities/:slug/posts')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get paginated posts for a community (sort: hot|new|top)' })
  @ApiQuery({ name: 'sort', enum: ['hot', 'new', 'top'], required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findByCommunity(
    @Param('slug') slug: string,
    @Query('sort') sort: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req: any,
  ) {
    return this.postsService.findByCommunity(
      slug,
      (sort as any) ?? 'hot',
      Number(page) || 1,
      Number(limit) || 20,
      req.user?.id,
    );
  }

  @Get('communities/:slug/posts/:postId')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get a single post by ID' })
  findOne(
    @Param('postId') postId: string,
    @Request() req: any,
  ) {
    return this.postsService.findOne(postId, req.user?.id);
  }

  @Post('communities/:slug/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a post in a community (must be a member)' })
  create(
    @Param('slug') slug: string,
    @Body() dto: CreatePostDto,
    @Request() req: any,
  ) {
    return this.postsService.create(req.user.id, slug, dto);
  }

  @Delete('communities/:slug/posts/:postId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete own post, or [EDITOR/ADMIN] any post' })
  delete(
    @Param('postId') postId: string,
    @Request() req: any,
  ) {
    return this.postsService.delete(postId, req.user.id, req.user.role);
  }

  @Post('posts/:postId/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Report a community post' })
  reportPost(
    @Param('postId') postId: string,
    @Body() dto: ReportDto,
    @Request() req: any,
  ) {
    return this.postsService.reportPost(req.user.id, postId, dto.reason, dto.details);
  }
}
