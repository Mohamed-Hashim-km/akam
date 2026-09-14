import { Module } from '@nestjs/common';
import { BooksService } from './books.service.js';
import { BooksController } from './books.controller.js';
import { EditorialBooksController } from './editorial-books.controller.js';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [UploadsModule],
  controllers: [BooksController, EditorialBooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
