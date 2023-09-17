import { UserBasicProfile } from 'types/user';
import { ChatRoomType } from './chat-room-type.enum';

export interface ChatRoomInterface {
  id: number;
  name: string;
  type: ChatRoomType;
  ownerId: number;
  participants: UserBasicProfile[];
}
