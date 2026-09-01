import { Module } from '@nestjs/common';
import { StoriesController } from './stories.controller.js';
import { StoriesService } from './stories.service.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';

@Module({
  imports: [UploadsModule, NotificationsModule],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
