import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './module/user/user.module';
import { AuthModule } from './module/auth/auth.module';
import entities from './typeorm/index';
import { MessagesModule } from './module/messages/messages.module';

@Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '../.env'}),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: "postgres",
          host: "localhost",
          port: 5432,
          username: process.env.POSTGRES_USER,
          password: process.env.POSTGRES_PASSWORD,
          database: process.env.POSTGRES_DB,
          entities: entities,
          
          //  !TODO: turn off during prod
          synchronize: true,
        }),
        inject: [ConfigService],
      }),
      UserModule,
      AuthModule,
	  MessagesModule,
    ],
    controllers: [],
    providers: [],
})

export class AppModule {}
