import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './common/prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { StoriesModule } from './stories/stories.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { EngagementModule } from './engagement/engagement.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { LibraryModule } from './library/library.module.js';
import { SettingsModule } from './settings/settings.module.js';
// Community Platform modules
import { CommunitiesModule } from './communities/communities.module.js';
import { PostsModule } from './posts/posts.module.js';
import { CommunityCommentsModule } from './community-comments/community-comments.module.js';
import { VotesModule } from './votes/votes.module.js';
import { EventsModule } from './events/events.module.js';
import { BooksModule } from './books/books.module.js';
import { MediaModule } from './media/media.module.js';
import { EditionsModule } from './editions/editions.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    StoriesModule,
    UploadsModule,
    NotificationsModule,
    CategoriesModule,
    EngagementModule,
    ModerationModule,
    LibraryModule,
    SettingsModule,
    // Community Platform
    CommunitiesModule,
    PostsModule,
    CommunityCommentsModule,
    VotesModule,
    EventsModule,
    BooksModule,
    MediaModule,
    EditionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
