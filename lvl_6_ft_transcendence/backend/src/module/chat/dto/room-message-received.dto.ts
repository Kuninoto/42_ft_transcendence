import { Chatter } from 'types';

export interface RoomMessageReceivedDTO {
  uniqueId: string;
  id: number;
  author: Chatter;
  content: string;
}
