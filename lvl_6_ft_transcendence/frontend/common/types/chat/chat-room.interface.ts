import { UserBasicProfile } from "../user";

export interface ChatRoomInterface {
  id: number;
  name: string;
  ownerId: number;
  participants: UserBasicProfile[];
}
