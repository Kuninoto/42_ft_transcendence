import { UserBasicProfile } from '../user';

export interface MeChatRoom {
  id: number;
  name: string;
  ownerId: number;
  participants: UserBasicProfile[];
}
