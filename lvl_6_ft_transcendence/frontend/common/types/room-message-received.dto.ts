import { Chatter } from './backend'
import { ChatRoomRoles } from './backend/chat/chat-room-roles.enum';

export interface RoomMessageReceivedDTO {
  uniqueId: string;
  id: number;
  author: Chatter;
  authorRole: ChatRoomRoles;
  content: string;
}
