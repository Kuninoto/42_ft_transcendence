// import { Message } from "../entities/chat.entity";
import { IsOptional, IsString } from "class-validator";

export class MessageDto{
	@IsString()
	text : string;

	@IsOptional()
	@IsString()
	ownerId?: string;
}
