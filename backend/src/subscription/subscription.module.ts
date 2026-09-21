import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubscriptionService } from './subscription.service.js';
import { SubscriptionController } from './subscription.controller.js';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService],
})
export class SubscriptionModule {}
