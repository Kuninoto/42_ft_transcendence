import { ChatRoomType } from 'src/entity/chat-room.entity';

export interface RoomInviteDTO {
  readonly inviterId: number;
  readonly roomName: string;
  readonly roomType: ChatRoomType;
}
