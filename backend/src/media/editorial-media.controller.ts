import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MediaService } from './media.service.js';
import { CreateMediaDto } from './dto/create-media.dto.js';
import { UpdateMediaDto } from './dto/update-media.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Editorial Media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EDITOR', 'ADMIN')
@Controller('editorial/media')
export class EditorialMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'List all media videos for editorial team with pagination, category filter & search' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 9;
    return this.mediaService.findAllEditorialPaginated(pageNum, limitNum, search, category);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new media video entry' })
  create(@Body() dto: CreateMediaDto) {
    return this.mediaService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing media video entry' })
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @Patch(':id/toggle-publish')
  @ApiOperation({ summary: 'Toggle published status of a media video' })
  togglePublish(@Param('id') id: string) {
    return this.mediaService.togglePublish(id);
  }

  @Patch(':id/toggle-featured')
  @ApiOperation({ summary: 'Toggle featured status on homepage for a media video' })
  toggleFeatured(@Param('id') id: string) {
    return this.mediaService.toggleFeatured(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media video entry' })
  remove(@Param('id') id: string) {
    return this.mediaService.remove(id);
  }
}
