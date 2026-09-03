import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EditionsService } from './editions.service.js';

@ApiTags('Editions')
@Controller('editions')
export class EditionsController {
  constructor(private readonly editionsService: EditionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get published editions with optional pagination' })
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    if (page || limit) {
      const pageNum = parseInt(page || '1', 10) || 1;
      const limitNum = parseInt(limit || '3', 10) || 3;
      return this.editionsService.findAllPublishedPaginated(pageNum, limitNum);
    }
    return this.editionsService.findAllPublished();
  }
}
