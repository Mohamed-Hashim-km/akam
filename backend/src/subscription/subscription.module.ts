import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../common/prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { SubscriptionService } from './subscription.service.js';
import { SubscriptionController } from './subscription.controller.js';
import { PayUService } from './payu.service.js';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule, NotificationsModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, PayUService],
  exports: [SubscriptionService, PayUService],
})
export class SubscriptionModule {}

