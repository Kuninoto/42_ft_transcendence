import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import entities from 'src/entity';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

@Injectable()
export class PostgresConfigService implements TypeOrmOptionsFactory {
  constructor() {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      database: process.env.POSTGRES_DB,
      host: process.env.POSTGRES_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      entities: entities,
      logging: true,
      autoLoadEntities: true,

      // TODO
      // Change all types using snake_case due to the (past) db restriction
      // and implement that on frontend too

      // This namingStrategy allows using a different case on entity
      // i.e Even if the variables' name is in lowerCamelCase on the user entity
      // the columns will be in snake_case
      namingStrategy: new SnakeNamingStrategy(),
      // TODO
      // Turn off during prod
      synchronize: true,
    };
  }
}
