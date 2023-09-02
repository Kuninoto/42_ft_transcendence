import { Chatter } from './chatter.interface';

export interface MeChatRoom {
  id: number;
  name: string;
  ownerId: number;
  participants: Chatter[];
}
