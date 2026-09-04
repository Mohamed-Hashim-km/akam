import { Controller, Get, Param, Header } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BooksService } from './books.service.js';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120')
  @ApiOperation({ summary: 'List all published book releases' })
  findAllPublished() {
    return this.booksService.findAllPublished();
  }

  @Get(':id')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=120')
  @ApiOperation({ summary: 'Get published book release by ID' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }
}
