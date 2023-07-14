// import { Message } from "../entities/chat.entity";
import { IsOptional, IsString } from "class-validator";

export class RoomDto{
	@IsString()
	name: string;
	
	@IsString()
	owner : string;

	@IsOptional()
	@IsString()
	ownerId: number;
}
