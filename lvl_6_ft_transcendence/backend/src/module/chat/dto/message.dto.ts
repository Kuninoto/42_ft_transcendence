// import { Message } from "../entities/chat.entity";
import { IsString } from "class-validator";

export class MessageDto{
	@IsString()
	text : string
}
