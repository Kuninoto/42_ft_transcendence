import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import entities from './typeorm/index';

@Module({
    imports: [
      ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env'}),
      TypeOrmModule.forRootAsync({
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          type: "postgres",
          host: "localhost",
          port: 5432,
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
    ],
    controllers: [],
    providers: [],
})

export class AppModule {}
