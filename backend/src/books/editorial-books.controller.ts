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
import { BooksService } from './books.service.js';
import { CreateBookDto } from './dto/create-book.dto.js';
import { UpdateBookDto } from './dto/update-book.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Editorial Books')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('EDITOR', 'ADMIN')
@Controller('editorial/books')
export class EditorialBooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @ApiOperation({ summary: 'List all book releases for editorial team with pagination and search' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.booksService.findAllEditorialPaginated(pageNum, limitNum, search);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new book release' })
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing book release' })
  update(@Param('id') id: string, @Body() dto: UpdateBookDto) {
    return this.booksService.update(id, dto);
  }

  @Patch(':id/toggle-publish')
  @ApiOperation({ summary: 'Toggle published status of a book release' })
  togglePublish(@Param('id') id: string) {
    return this.booksService.togglePublish(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a book release' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
