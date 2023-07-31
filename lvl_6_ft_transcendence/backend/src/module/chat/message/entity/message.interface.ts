import { UserI } from "../../../../entity/user.interface";
import { RoomI } from "../../room/entity/room.interface";

export interface MessageI {
  id?: number;
  text?: string;
  user?: string;
}
