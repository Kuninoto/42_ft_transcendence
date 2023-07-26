// import { Message } from "../entities/chat.entity";
import { IsOptional, IsString } from "class-validator";
import { User } from "src/entity/user.entity";
import { OneToMany } from "typeorm";

export class RoomDto{
	@IsString()
	name: string;
	
	@IsString()
	owner : string;

	@IsOptional()
	@IsString()
	ownerId: number;

	@IsOptional()
	users: User[];
}
