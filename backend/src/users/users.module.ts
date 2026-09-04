import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UploadsModule } from '../uploads/uploads.module.js';

@Module({
  imports: [
    UploadsModule,
    MulterModule.register({ storage: memoryStorage() }),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
