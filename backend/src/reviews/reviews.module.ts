import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service.js';
import { ReviewsController } from './reviews.controller.js';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [PrismaModule, UploadsModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
