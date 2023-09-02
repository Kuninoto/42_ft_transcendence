import { Chatter } from 'types';

export interface RoomMessageReceivedResponse {
  readonly uniqueId: string;
  readonly id: number;
  readonly author: Chatter;
  readonly content: string;
}
