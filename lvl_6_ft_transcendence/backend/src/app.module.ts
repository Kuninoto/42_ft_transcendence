import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './module/user/user.module';
import { AuthModule } from './module/auth/auth.module';
import entities from './typeorm/index';
import { MessagesModule } from './module/messages/messages.module';

@Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env'}),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: "postgres",
          host: "localhost",
          port: 5432,
          // !TODO
          // username: configService.get("POSTGRES_USER"),
          // password: configService.get("POSTGRES_PASSWORD"),
          // database: configService.get("POSTGRES_DB"),
          username: "user123",
          password: "passwd123",
          database: "transcendence_db",
          entities: entities,
          
          //  !TODO: turn of during prod
          synchronize: true,
        }),
        inject: [ConfigService],
      }),
      UserModule,
    //   AuthModule,
	MessagesModule
    ],
    controllers: [],
    providers: [],
})

export class AppModule {}
