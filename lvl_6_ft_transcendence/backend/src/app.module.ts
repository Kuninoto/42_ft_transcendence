import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { join } from 'path';
import { AuthModule } from 'src/module/auth/auth.module';
import { UsersModule } from 'src/module/users/users.module';
import { PostgresConfigService } from './config/database/postgres-config.service';
import { AchievementModule } from './module/achievement/achievement.module';
import { ChatModule } from './module/chat/chat.module';
import { ConnectionModule } from './module/connection/connection.module';
import { FriendshipsModule } from './module/friendships/friendships.module';
import { GameModule } from './module/game/game.module';
import { MeModule } from './module/me/me.module';
import { UserStatsModule } from './module/user-stats/user-stats.module';

@Module({
  controllers: [],
  imports: [
    TypeOrmModule.forRootAsync({
      useClass: PostgresConfigService,
      imports: [ConfigModule],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),

      // The base URL path to serve the images from
      serveRoot: '/api/users/avatars/',

      serveStaticOptions: {
        // Don't display a directory index
        index: false,
        // Don't redirect to a similar file if the requested one isn't found
        redirect: false,
      },
    }),
    AchievementModule,
    AuthModule,
    ChatModule,
    ConnectionModule,
    FriendshipsModule,
    GameModule,
    MeModule,
    UserStatsModule,
    UsersModule,
  ],
  providers: [],
})
export class AppModule {}
