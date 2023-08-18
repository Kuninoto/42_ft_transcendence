import { ChatRoomType } from 'src/entity/chat-room.entity';

export interface CreateRoomDTO {
  readonly name: string;
  readonly type: ChatRoomType;
  readonly password?: string;
}
