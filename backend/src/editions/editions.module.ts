import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { EditionsService } from './editions.service.js';
import { EditionsController } from './editions.controller.js';
import { EditorialEditionsController } from './editorial-editions.controller.js';

@Module({
  imports: [PrismaModule, AuthModule, UploadsModule],
  controllers: [EditionsController, EditorialEditionsController],
  providers: [EditionsService],
  exports: [EditionsService],
})
export class EditionsModule {}
