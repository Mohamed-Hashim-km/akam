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
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Optional,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/decorators/current-user.decorator.js';
import { StoriesService } from './stories.service.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { CreateStoryDto } from './dto/create-story.dto.js';
import { UpdateStoryDto } from './dto/update-story.dto.js';
import { ReviewStoryDto } from './dto/review-story.dto.js';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(
    private readonly storiesService: StoriesService,
    private readonly uploadsService: UploadsService,
  ) {}

  // ─── Public endpoints ───────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'List published stories (publicly accessible)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status (default: APPROVED)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'category', required: false, description: 'Category filter' })
  @ApiQuery({ name: 'authorId', required: false, description: 'Filter by authorId' })
  async findAll(
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('authorId') authorId?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.storiesService.findAll(status, pageNum, limitNum, search, category, authorId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single story by id or slug' })
  async findOne(@Param('id') id: string) {
    return this.storiesService.findOne(id);
  }

  // ─── Author endpoints (require JWT) ──────────────────────────────────────

  @Get('my/stories')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all stories by the current author' })
  async getMyStories(@CurrentUser() user: AuthUser) {
    return this.storiesService.getAuthorStories(user.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new story draft' })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateStoryDto) {
    return this.storiesService.create(user.id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update story title/content (DRAFT or REJECTED only)' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: UpdateStoryDto,
  ) {
    return this.storiesService.update(id, user.id, dto);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit story for editorial review' })
  async submitForReview(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.storiesService.submitForReview(id, user.id);
  }

  @Post(':id/cover')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Upload cover image for a story' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadCover(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.uploadsService.uploadFile(file, 'covers', id);
    return this.storiesService.uploadCover(id, user.id, url);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a story (author or editor)' })
  async delete(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.storiesService.delete(id, user.id, user.role);
  }

  // ─── Editorial endpoints ──────────────────────────────────────────────────

  @Get('queue/pending')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor] Get the pending review queue' })
  async getPendingQueue(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.storiesService.getPendingQueue(pageNum, limitNum, search);
  }

  @Post(':id/review')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EDITOR', 'ADMIN')
  @ApiOperation({ summary: '[Editor] Approve or reject a story' })
  async reviewStory(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() dto: ReviewStoryDto,
  ) {
    return this.storiesService.reviewStory(id, user.id, dto);
  }
}
