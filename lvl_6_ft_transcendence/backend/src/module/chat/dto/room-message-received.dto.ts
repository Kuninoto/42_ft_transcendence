import { Chatter } from 'types';
import { ChatRoomRoles } from 'types/chat/chat-room-roles.enum';

export interface RoomMessageReceivedDTO {
  uniqueId: string;
  id: number;
  author: Chatter;
  authorRole: ChatRoomRoles;
  content: string;
}
