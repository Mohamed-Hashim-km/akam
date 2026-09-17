import { Module } from '@nestjs/common';
import { EngagementController } from './engagement.controller.js';
import { EngagementService } from './engagement.service.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [NotificationsModule],
  controllers: [EngagementController],
  providers: [EngagementService],
  exports: [EngagementService],
})
export class EngagementModule {}
