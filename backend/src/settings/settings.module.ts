import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SettingsService } from './settings.service.js';
import { SettingsController } from './settings.controller.js';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
