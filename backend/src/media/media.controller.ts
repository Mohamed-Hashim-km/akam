import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MediaService } from './media.service.js';

@ApiTags('Public Media')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'Get published media videos paginated by category or featured status' })
  @ApiQuery({ name: 'category', required: false, description: 'interviews | conversations | cultural | recordings' })
  @ApiQuery({ name: 'featured', required: false, description: 'true | false' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 6;
    const isFeaturedOnly = featured === 'true';
    return this.mediaService.findAllPublishedPaginated(category, pageNum, limitNum, isFeaturedOnly);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single published media video details' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }
}
