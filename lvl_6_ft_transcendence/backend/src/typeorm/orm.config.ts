import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import entities from ".";

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
})