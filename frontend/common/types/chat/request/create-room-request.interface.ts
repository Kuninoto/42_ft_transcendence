import { ChatRoomType } from "../chat-room-type.enum";

export interface CreateRoomRequest {
  readonly name: string;
  readonly password?: string;
  readonly type: ChatRoomType;
}
