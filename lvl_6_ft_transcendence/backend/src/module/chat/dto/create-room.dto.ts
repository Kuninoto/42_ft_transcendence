import { ChatRoomType } from 'src/entity/chat-room.entity';

export interface CreateRoomDTO {
  readonly name: string;
  readonly room_type: ChatRoomType;
  readonly password?: string;
}
