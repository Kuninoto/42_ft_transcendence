import { User } from "src/entity/user.entity";
import { UserI } from "../../../entity/user.interface";
import { Meta } from "./meta.interface";

export interface RoomI {
  name?: string;
  owner?: string;
  ownerId?: number;
  users?: User[];
  created_at?: Date;
  updated_at?: Date;
}

export interface RoomPaginationI {
	items: RoomI[];
	meta: Meta;
}