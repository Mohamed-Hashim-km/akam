import { Module } from '@nestjs/common';
import { VotesController } from './votes.controller.js';
import { VotesService } from './votes.service.js';
import { PrismaModule } from '../common/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [VotesController],
  providers: [VotesService],
})
export class VotesModule {}
