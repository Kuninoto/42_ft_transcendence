import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import 'dotenv/config';
import { join } from 'path';
import { AuthModule } from 'src/module/auth/auth.module';
import { UsersModule } from 'src/module/users/users.module';
import { AchievementModule } from './module/achievement/achievement.module';
import { JwtAuthGuard } from './module/auth/guard/jwt-auth.guard';
import { ChatModule } from './module/chat/chat.module';
import { FriendshipsModule } from './module/friendships/friendships.module';
import { GameModule } from './module/game/game.module';
import { MeModule } from './module/me/me.module';
import { UserStatsModule } from './module/user-stats/user-stats.module';
import entities from './typeorm/index';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'postgres',
        host: process.env.POSTGRES_HOST,
        port: 5432,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB,
        entities: entities,
        autoLoadEntities: true,
        // TODO
        // Turn off during prod
        synchronize: true,
      }),
      inject: [ConfigService],
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
    FriendshipsModule,
    GameModule,
    MeModule,
    UserStatsModule,
    UsersModule,
    ChatModule,
  ],
  controllers: [],
  providers: [JwtAuthGuard],
})
export class AppModule {}
