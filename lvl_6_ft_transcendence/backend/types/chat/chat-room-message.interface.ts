import { Chatter } from './chatter.interface';

export interface ChatRoomMessage {
  uniqueId: string;
  author: Chatter;
  content: string;
}
