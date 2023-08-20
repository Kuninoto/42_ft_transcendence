import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { join } from 'path';
import { AuthModule } from 'src/module/auth/auth.module';
import { UsersModule } from 'src/module/users/users.module';

import entities from './entity/index';
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
    ConfigModule.forRoot({ envFilePath: '../.env', isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: () => ({
        autoLoadEntities: true,
        database: process.env.POSTGRES_DB,
        entities: entities,
        host: process.env.POSTGRES_HOST,
        password: process.env.POSTGRES_PASSWORD,
        port: 5432,
        // Turn off during prod
        synchronize: true,
        type: 'postgres',
        // TODO
        username: process.env.POSTGRES_USER,
      }),
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
