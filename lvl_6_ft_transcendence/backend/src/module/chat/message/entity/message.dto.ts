//TODO delete this if not used
import { IsOptional, IsString } from "class-validator";
import { RoomI } from "../../room/entity/room.interface";
import { UserI } from "src/entity/user.interface";

export class MessageDto{
	@IsString()
	text : string;

	@IsOptional()
	room?: RoomI;

	@IsOptional()
	user?: UserI;
}
