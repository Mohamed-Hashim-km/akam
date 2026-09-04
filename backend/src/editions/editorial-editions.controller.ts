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
import { EditionsService } from './editions.service.js';
import { CreateEditionDto } from './dto/create-edition.dto.js';
import { UpdateEditionDto } from './dto/update-edition.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Editorial Editions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EDITOR', 'ADMIN')
@Controller('editorial/editions')
export class EditorialEditionsController {
  constructor(private readonly editionsService: EditionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all editions (editorial, with pagination & search)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.editionsService.findAllEditorial(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
      search,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new edition' })
  create(@Body() dto: CreateEditionDto) {
    return this.editionsService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an edition' })
  update(@Param('id') id: string, @Body() dto: UpdateEditionDto) {
    return this.editionsService.update(id, dto);
  }

  @Patch(':id/toggle-publish')
  @ApiOperation({ summary: 'Toggle published status of an edition' })
  togglePublish(@Param('id') id: string) {
    return this.editionsService.togglePublish(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an edition' })
  remove(@Param('id') id: string) {
    return this.editionsService.remove(id);
  }
}
