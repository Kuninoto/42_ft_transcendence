import { UserBasicProfile } from 'types/user';

export interface MeChatRoom {
  id: number;
  name: string;
  ownerId: number;
  participants: UserBasicProfile[];
}
