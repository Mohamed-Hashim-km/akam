import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller.js';
import { StoriesService } from './stories.service.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubscriptionModule } from '../subscription/subscription.module.js';
import { ModerationModule } from '../moderation/moderation.module.js';

@Module({
  imports: [UploadsModule, NotificationsModule, SubscriptionModule, ModerationModule],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
