import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/module/users/users.module';
import { AuthModule } from 'src/module/auth/auth.module';
import { ServeStaticModule } from '@nestjs/serve-static/dist/serve-static.module';
import { join } from 'path';
import { FriendshipsModule } from './module/friendships/friendships.module';
import entities from 'src/typeorm/index';
import 'dotenv/config';

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
        // !TODO
        // Turn off during prod
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/api/users/avatars/', // The base URL path to serve the images from
      // Do not display a directory index
      // Do not redirect to a similar file if the requested one isn't found
      serveStaticOptions: { index: false, redirect: false },
    }),
    AuthModule,
    FriendshipsModule,
    UsersModule
  ],
  controllers: [],
  providers: [],
})

export class AppModule {}
