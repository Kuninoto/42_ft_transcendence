import { Chatter } from '../../chatter.interface';

export interface RoomMessageReceivedEvent {
  readonly uniqueId: string;
  readonly id: number;
  readonly author: Chatter;
  readonly content: string;
}
