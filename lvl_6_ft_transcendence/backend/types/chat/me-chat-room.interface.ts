import { Chatter } from './chatter.interface';

export interface MeChatRoom {
  id: number;
  name: string;
  ownerName: string;
  participants: Chatter[];
}
