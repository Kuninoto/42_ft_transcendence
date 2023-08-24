import { Chatter } from './chatter.interface';

export interface ChatRoomInterface {
  roomId: number;
  roomName: string;
  ownerName: string;
  participants: Chatter[];
}
