import { Module } from '@nestjs/common';
import { EventsService } from './events.service.js';
import { EventsController } from './events.controller.js';
import { EditorialEventsController } from './editorial-events.controller.js';
import { PrismaModule } from '../common/prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  providers: [EventsService],
  controllers: [EventsController, EditorialEventsController],
  exports: [EventsService],
})
export class EventsModule {}
