import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import entities from 'src/entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

console.log('NODE_ENV = ' + process.env.NODE_ENV);

@Injectable()
export class PostgresConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      database: process.env.POSTGRES_DB,
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      entities: entities,
      autoLoadEntities: true,
      logging: false,
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: true, // process.env.NODE_ENV === 'dev',
    };
  }
}
