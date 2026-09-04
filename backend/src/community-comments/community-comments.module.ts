import { Module } from '@nestjs/common';
import { CommunityCommentsController } from './community-comments.controller.js';
import { CommunityCommentsService } from './community-comments.service.js';
import { PrismaModule } from '../common/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [CommunityCommentsController],
  providers: [CommunityCommentsService],
  exports: [CommunityCommentsService],
})
export class CommunityCommentsModule {}
