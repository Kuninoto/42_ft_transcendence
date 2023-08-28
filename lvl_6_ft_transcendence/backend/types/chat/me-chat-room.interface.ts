import { ChatRoomRoles } from './chat-room-roles.enum';
import { Chatter } from './chatter.interface';

export interface MeChatRoom {
  id: number;
  name: string;
  ownerName: string;
  myRole: ChatRoomRoles;
  participants: Chatter[];
}
